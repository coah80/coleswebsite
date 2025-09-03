import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Folder, FolderOpen } from 'lucide-react';
import ProfileSection from '@/components/ProfileSection';
import SocialLinksSection from '@/components/SocialLinksSection';
import PortfolioSection from '@/components/PortfolioSection';
import SubmissionsSection from '@/components/SubmissionsSection';
import AdminButton from '@/components/AdminButton';

const LandscapeLayout = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'portfolio' | 'submissions'>('home');

  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      setActiveTab(event.detail);
    };

    window.addEventListener('changeTab', handleTabChange as EventListener);
    return () => window.removeEventListener('changeTab', handleTabChange as EventListener);
  }, []);

  const tabs = [
    { id: 'home' as const, label: 'home' },
    { id: 'portfolio' as const, label: 'portfolio' },
    { id: 'submissions' as const, label: 'submissions' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'portfolio':
        return <PortfolioSection />;
      case 'submissions':
        return <SubmissionsSection />;
      default:
        return (
          <div className="grid xl:grid-cols-2 gap-4 lg:gap-8 xl:gap-12 h-full">
            <ProfileSection />
            <SocialLinksSection />
          </div>
        );
    }
  };

  return (
    <div className="h-screen bg-background overflow-hidden">
      <AdminButton />
      {/* Folder Tabs */}
      <div className="border-b border-border/30 bg-card/30">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex gap-1 pt-2 lg:pt-4 xl:pt-6">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = isActive ? FolderOpen : Folder;
              
              return (
                <Button
                  key={tab.id}
                  variant="ghost"
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative rounded-t-lg rounded-b-none border-t border-l border-r border-b-0
                    px-3 sm:px-4 lg:px-6 py-2 lg:py-3 text-sm lg:text-base xl:text-lg
                    ${isActive 
                      ? 'bg-background border-border text-foreground shadow-sm' 
                      : 'bg-card/50 border-border/50 text-muted-foreground hover:bg-card hover:text-foreground'
                    }
                    ${isActive ? 'z-10' : 'z-0'}
                  `}
                >
                  <Icon className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />
                  <span className="font-heading font-medium">{tab.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <main className="max-w-[1800px] mx-auto p-3 sm:p-4 lg:p-6 xl:p-8 2xl:p-12 h-[calc(100vh-60px)] lg:h-[calc(100vh-80px)] xl:h-[calc(100vh-100px)]">
        <Card className="h-full bg-gradient-card border-border/50 p-4 sm:p-6 lg:p-8 xl:p-12 2xl:p-16">
          {renderContent()}
        </Card>
      </main>
    </div>
  );
};

export default LandscapeLayout;