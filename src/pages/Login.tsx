import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import luandaHero from "@/assets/luanda-hero.jpg";
import sosLogo from "@/assets/sos-logo.png";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "comandante" && password === "sos2024") {
      localStorage.setItem("sos-auth", "true");
      navigate("/dashboard");
    } else {
      setError("Credenciais inválidas. Tente novamente.");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${luandaHero})` }}
      />
      <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="glass-panel rounded-lg p-8">
          <div className="flex flex-col items-center mb-8">
            <img src={sosLogo} alt="SOS Esquadra" className="w-28 h-28 object-contain mb-2" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              SOS ESQUADRA
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sistema de Comando Policial — Luanda
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Nome de utilizador"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Palavra-passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-secondary border-border"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}

            <Button type="submit" className="w-full font-semibold">
              Entrar no Sistema
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Acesso restrito a comandantes autorizados.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
