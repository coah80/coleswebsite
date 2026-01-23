import { Search } from 'lucide-react';

interface FakeSearchBarProps {
  query?: string;
  className?: string;
}

const FakeSearchBar = ({ query = 'coah.dev', className = '' }: FakeSearchBarProps) => {
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 bg-muted/30 border border-border/50 rounded-full ${className}`}>
      <Search className="w-3 h-3 text-muted-foreground" />
      <span className="text-sm text-muted-foreground font-mono">{query}</span>
      <div className="w-px h-4 bg-foreground animate-pulse" />
    </div>
  );
};

export default FakeSearchBar;
