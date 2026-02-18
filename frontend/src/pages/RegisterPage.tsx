import { SignUp } from '@clerk/clerk-react';

const RegisterPage = () => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <SignUp routing="path" path="/register" />
        </div>
    );
};

export default RegisterPage;
