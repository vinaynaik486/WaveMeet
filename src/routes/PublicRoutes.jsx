import { Route, Routes } from "react-router-dom";
import LandingPage from "../pages/LandingPage";

const PublicRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<h1 className="text-center mt-10">404 - Page Not Found</h1>} />
        </Routes>
    );
};

export default PublicRoutes;
