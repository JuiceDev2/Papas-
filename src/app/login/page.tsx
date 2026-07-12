import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-paper rounded-2xl shadow-sm p-6">
        <p className="font-display font-extrabold text-xl text-coffee mb-1">Papas Doradas 🥔</p>
        <p className="text-sm text-coffee/60 mb-6">Acceso para propietario, admin y colaboradores</p>
        <LoginForm />
      </div>
    </div>
  );
}
