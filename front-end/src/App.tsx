import { BrowserRouter, Navigate, Routes, Route } from "react-router";
import { AuthProvider } from "./contexts/AuthContext";
import { DialogProvider } from "./contexts/DialogContext";
import { RequireAuth } from "./components/RequireAuth";
import { Layout } from "./components/Layout";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { PatientsList } from "./components/PatientsList";
import { PatientsForm } from "./components/PatientsForm";
import { PatientRecord } from "./components/PatientRecord";
import { AssessmentsList } from "./components/AssessmentsList";
import { AssessmentsForm } from "./components/AssessmentsForm";
import { MealPlansForm } from "./components/MealPlansForm";
import { FoodsList } from "./components/FoodsList";
import { FoodsForm } from "./components/FoodsForm";
import { DietsList } from "./components/DietsList";
import { DietsForm } from "./components/DietsForm";

function App() {
  return (
    <AuthProvider>
      <DialogProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />

            {/* Rotas internas: exigem login e usam o menu lateral (Layout) */}
            <Route
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />

              <Route path="/pacientes" element={<PatientsList />} />
              <Route path="/pacientes/:id" element={<PatientsForm />} />
              <Route path="/pacientes/:id/prontuario" element={<PatientRecord />} />
              <Route path="/pacientes/:patientId/avaliacoes/:id" element={<AssessmentsForm />} />
              <Route path="/pacientes/:patientId/planos/:id" element={<MealPlansForm />} />
              {/* Novo plano a partir do Painel: o paciente é escolhido no formulário */}
              <Route path="/planos/:id" element={<MealPlansForm />} />

              <Route path="/avaliacoes" element={<AssessmentsList />} />

              <Route path="/alimentos" element={<FoodsList />} />
              <Route path="/alimentos/:id" element={<FoodsForm />} />

              <Route path="/dietas" element={<DietsList />} />
              <Route path="/dietas/:id" element={<DietsForm />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </DialogProvider>
    </AuthProvider>
  );
}

export default App;