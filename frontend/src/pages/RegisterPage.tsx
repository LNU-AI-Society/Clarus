import { SignUp } from '@clerk/clerk-react';
import LanguageSwitch from '../components/LanguageSwitch';

const RegisterPage = () => {
    return (
        <div className="relative flex min-h-screen items-center justify-center bg-slate-50">
            <div className="absolute right-4 top-4">
                <LanguageSwitch />
            </div>
            <SignUp routing="path" path="/register" />
        </div>
    );
};

export default RegisterPage;
