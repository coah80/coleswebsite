import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Secure password check - change this to your preferred password
    const adminPassword = "onlyCOLEcanlogin!";
    
    if (password === adminPassword) {
      sessionStorage.setItem('adminAuth', 'true');
      navigate('/admin/dashboard');
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid password",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4">
      <Card className="w-full max-w-md p-4 sm:p-6 bg-gradient-card border-border/50">
        <div className="mb-4 sm:mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mb-3 sm:mb-4 text-xs sm:text-sm"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            Back
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Admin Access</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Enter the admin password to continue</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
          <div>
            <Label htmlFor="password" className="text-xs sm:text-sm">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
              className="mt-1 text-sm"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full text-sm" 
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Login'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AdminLogin;