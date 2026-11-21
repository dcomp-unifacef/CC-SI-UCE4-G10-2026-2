import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Icon } from '../components/Icon'
import type { IconName } from '../components/Icon'

type AlertVariant = 'success' | 'error' | 'warning' | 'info'

type ConfirmOptions = {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  // Exclusões: pede uma segunda confirmação (caixa de seleção) antes de liberar o botão
  danger?: boolean;
}

type DialogState =
  | { kind: 'alert'; variant: AlertVariant; title: string; message: ReactNode }
  | ({ kind: 'confirm' } & ConfirmOptions)

type DialogContextValue = {
  showAlert: (message: ReactNode, variant?: AlertVariant, title?: string) => Promise<void>;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextValue | null>(null)

const defaultTitles: Record<AlertVariant, string> = {
  success: 'Tudo certo',
  error: 'Algo deu errado',
  warning: 'Atenção',
  info: 'Informação',
}

const variantIcons: Record<AlertVariant, IconName> = {
  success: 'check',
  error: 'alert',
  warning: 'alert',
  info: 'info',
}

// Substitui window.alert e window.confirm por janelas (pop-ups) no visual da aplicação.
// As funções devolvem uma Promise, então podem ser usadas com await:
//   await showAlert('Paciente salvo com sucesso.', 'success')
//   if (!await showConfirm({ title: 'Excluir?', message: '...', danger: true })) return
export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [checked, setChecked] = useState(false)
  // Guarda a função que "resolve" a Promise da janela aberta
  const resolver = useRef<((value: boolean) => void) | null>(null)
  const confirmButton = useRef<HTMLButtonElement>(null)
  const cancelButton = useRef<HTMLButtonElement>(null)

  function open(state: DialogState) {
    // Se outra janela estava aberta, ela é considerada cancelada
    resolver.current?.(false)
    setChecked(false)
    setDialog(state)
    return new Promise<boolean>(resolve => {
      resolver.current = resolve
    })
  }

  function close(result: boolean) {
    resolver.current?.(result)
    resolver.current = null
    setDialog(null)
  }

  async function showAlert(message: ReactNode, variant: AlertVariant = 'info', title?: string) {
    await open({ kind: 'alert', variant, title: title ?? defaultTitles[variant], message })
  }

  function showConfirm(options: ConfirmOptions) {
    return open({ kind: 'confirm', ...options })
  }

  // Foco no botão principal ao abrir (ou em "Cancelar" nas exclusões) e Esc para fechar
  useEffect(() => {
    if (!dialog) return

    const isDanger = dialog.kind === 'confirm' && dialog.danger
    ;(isDanger ? cancelButton : confirmButton).current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close(false)
    }

    // Impede a página de rolar por trás da janela
    document.body.classList.add('modal-open')
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.classList.remove('modal-open')
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [dialog]) // <~ VETOR DE DEPENDÊNCIAS

  const variant: AlertVariant = dialog?.kind === 'alert' ? dialog.variant
    : dialog?.kind === 'confirm' && dialog.danger ? 'error' : 'warning'
  const needsCheck = dialog?.kind === 'confirm' && dialog.danger

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {dialog && (
        <>
          <div className="modal-backdrop fade show" />
          <div
            className="modal fade show d-block"
            role={dialog.kind === 'alert' ? 'alertdialog' : 'dialog'}
            aria-modal="true"
            aria-labelledby="ns-dialog-title"
            aria-describedby="ns-dialog-message"
            onClick={event => {
              // Clique fora da janela: fecha avisos, mas não confirma nada
              if (event.target === event.currentTarget) close(false)
            }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content ns-dialog">
                <div className="modal-body text-center p-4">
                  <span className={`ns-dialog-icon ns-dialog-${variant}`} aria-hidden="true">
                    <Icon name={dialog.kind === 'confirm' && dialog.danger ? 'trash' : variantIcons[variant]} size={26} />
                  </span>
                  <h2 id="ns-dialog-title" className="h5 fw-bold mt-3 mb-2">{dialog.title}</h2>
                  <div id="ns-dialog-message" className="text-secondary">{dialog.message}</div>

                  {needsCheck && (
                    <div className="form-check text-start ns-dialog-check mt-3">
                      <input
                        id="ns-dialog-check"
                        type="checkbox"
                        className="form-check-input"
                        checked={checked}
                        onChange={event => setChecked(event.target.checked)}
                      />
                      <label htmlFor="ns-dialog-check" className="form-check-label small">
                        Entendo que esta ação não pode ser desfeita.
                      </label>
                    </div>
                  )}
                </div>

                <div className="modal-footer border-0 pt-0 px-4 pb-4 justify-content-center">
                  {dialog.kind === 'confirm' && (
                    <button ref={cancelButton} type="button" className="btn btn-outline-secondary" onClick={() => close(false)}>
                      Cancelar
                    </button>
                  )}
                  <button
                    ref={confirmButton}
                    type="button"
                    className={needsCheck ? 'btn btn-danger' : 'btn btn-primary'}
                    disabled={needsCheck && !checked}
                    onClick={() => close(true)}
                  >
                    {dialog.kind === 'confirm' ? dialog.confirmLabel ?? 'Confirmar' : 'OK'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const context = useContext(DialogContext)
  if (!context) throw new Error('useDialog deve ser usado dentro de <DialogProvider>.')
  return context
}