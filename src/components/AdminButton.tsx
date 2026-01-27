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
      className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-50 h-7 w-7 sm:h-8 sm:w-8 bg-card/50 border border-border/50 hover:bg-card hover:border-border"
    >
      <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
    </Button>
  );
};

export default AdminButton;