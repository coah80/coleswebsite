import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/admin')}
      className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-50 h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-ctp-surface0/50 border border-ctp-surface1/50 hover:bg-ctp-surface0 hover:border-ctp-surface2 transition-all duration-150 flex items-center justify-center"
    >
      <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-ctp-overlay1" />
    </button>
  );
};

export default AdminButton;
