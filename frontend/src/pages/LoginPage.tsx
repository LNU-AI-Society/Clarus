import { SignIn } from '@clerk/clerk-react';
import LanguageSwitch from '../components/LanguageSwitch';

const LoginPage = () => {
    return (
        <div className="relative flex min-h-screen items-center justify-center bg-slate-50">
            <div className="absolute right-4 top-4">
                <LanguageSwitch />
            </div>
            <SignIn routing="path" path="/login" />
        </div>
    );
};

export default LoginPage;
