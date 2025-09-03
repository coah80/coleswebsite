import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const AdminButton = () => {
  const navigate = useNavigate();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => navigate('/admin')}
      className="fixed top-4 right-4 z-50 h-8 w-8 bg-card/50 border border-border/50 hover:bg-card hover:border-border"
    >
      <Settings className="h-4 w-4" />
    </Button>
  );
};

export default AdminButton;