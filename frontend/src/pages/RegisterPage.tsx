import { SignUp } from '@clerk/clerk-react';
import Navbar from '../components/Navbar';

const RegisterPage = () => {
    return (
        <div className="relative flex min-h-screen flex-col bg-slate-50">
            <Navbar backTo="/" />
            <main className="flex flex-1 items-center justify-center">
                <SignUp routing="path" path="/register" />
            </main>
        </div>
    );
};

export default RegisterPage;
