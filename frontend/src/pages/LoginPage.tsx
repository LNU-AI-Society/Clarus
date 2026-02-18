import { SignIn } from '@clerk/clerk-react';

const LoginPage = () => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <SignIn routing="path" path="/login" />
        </div>
    );
};

export default LoginPage;
