import { SignIn } from '@clerk/clerk-react';
import Navbar from '../components/Navbar';

const LoginPage = () => {
    return (
        <div className="relative flex min-h-screen flex-col bg-slate-50">
            <Navbar backTo="/" />
            <main className="flex flex-1 items-center justify-center">
                <SignIn routing="path" path="/login" />
            </main>
        </div>
    );
};

export default LoginPage;
