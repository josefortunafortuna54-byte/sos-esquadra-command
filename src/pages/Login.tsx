import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import sosLogo from "@/assets/sos-logo.png";
import luandaHero from "@/assets/luanda-hero.jpg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("Credenciais inválidas. Tente novamente.");
        return;
      }

      // Verificar se é agente/admin
      const { data: agente } = await supabase
        .from("police_agents")
        .select("id, role, ativo")
        .eq("auth_id", data.user.id)
        .maybeSingle();

      if (!agente || !agente.ativo) {
        await supabase.auth.signOut();
        setError("Acesso não autorizado. Conta não registada como agente.");
        return;
      }

      navigate("/dashboard");
    } catch {
      setError("Erro ao ligar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${luandaHero})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background/80" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="backdrop-blur-xl bg-background/30 rounded-lg p-8 border border-border/20 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <img src={sosLogo} alt="SOS Esquadra" className="w-40 h-40 object-contain mb-2 drop-shadow-xl" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">SOS ESQUADRA</h1>
            <p className="text-sm text-muted-foreground mt-1">Sistema de Comando Policial — Luanda</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email institucional"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-secondary border-border"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-secondary border-border"
                required
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
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "A entrar..." : "ENTRAR"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Credenciais fornecidas pelo comando da esquadra.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
