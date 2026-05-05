import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Board from "./pages/Board";
import Docs from "./pages/Docs";
import RungPage from "./pages/Rung";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/board" element={<Board />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/rung" element={<RungPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
