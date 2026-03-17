import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { operation: 'login', password }
      });

      if (error || !data?.success) {
        toast({
          title: "Access Denied",
          description: "Invalid password",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      sessionStorage.setItem('adminAuth', 'true');
      sessionStorage.setItem('adminToken', data.token);
      navigate('/admin/dashboard');
    } catch {
      toast({
        title: "Access Denied",
        description: "Something went wrong, try again",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-ctp-base flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-ctp-surface1/50 bg-ctp-surface0/40 p-6">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mb-4 flex items-center text-ctp-overlay1 hover:text-ctp-text text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-heading font-bold text-ctp-text">Admin Access</h1>
          <p className="text-sm text-ctp-subtext1">Enter the admin password to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="password" className="text-sm text-ctp-subtext1 font-body">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
              className="mt-1 w-full rounded-xl border border-ctp-surface1/60 bg-ctp-surface0/40 py-3 px-4 text-ctp-text placeholder:text-ctp-overlay1 focus:border-ctp-mauve/50 focus:ring-1 focus:ring-ctp-mauve/30 outline-none font-body"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-ctp-mauve text-ctp-crust font-heading font-bold rounded-xl py-2.5 hover:brightness-110 disabled:opacity-30 transition-all"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
