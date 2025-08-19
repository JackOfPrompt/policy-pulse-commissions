import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
    user,
    profile,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const navItems = [{
    name: "Home",
    path: "/"
  }, {
    name: "Products",
    path: "/products"
  }, {
    name: "Compare Plans",
    path: "/compare-plans"
  }, {
    name: "Plan Comparison",
    path: "/plan-comparison"
  }, {
    name: "About",
    path: "/about"
  }];
  const handleSignOut = async () => {
    const {
      error
    } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out."
      });
      navigate('/');
    }
  };
  return <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/154873ec-48fd-43c5-a8eb-d5a8a3d9fad8.png" 
              alt="CRESTLINE Logo" 
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map(item => <Link key={item.name} to={item.path} className="text-foreground hover:text-primary transition-colors duration-200 font-medium">
                {item.name}
              </Link>)}
            
            {user ? <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <User size={16} />
                    {profile?.first_name || 'User'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-popover border border-border z-50">
                  
                  
                   <DropdownMenuSeparator />
                   {profile?.role === 'system_admin' && <DropdownMenuItem asChild>
                       <Link to="/admin-dashboard" className="w-full">
                         Admin Dashboard
                       </Link>
                     </DropdownMenuItem>}
                   {profile?.role === 'tenant_admin' && <DropdownMenuItem asChild>
                       <Link to="/tenant-admin-dashboard" className="w-full">
                         Tenant Dashboard
                       </Link>
                     </DropdownMenuItem>}
                   {profile?.role === 'tenant_employee' && <DropdownMenuItem asChild>
                       <Link to="/employee-dashboard" className="w-full">
                         Employee Dashboard
                       </Link>
                     </DropdownMenuItem>}
                   {profile?.role === 'tenant_agent' && <DropdownMenuItem asChild>
                       <Link to="/agent-dashboard" className="w-full">
                         Agent Dashboard
                       </Link>
                     </DropdownMenuItem>}
                   {profile?.role === 'customer' && <DropdownMenuItem asChild>
                       <Link to="/customer-dashboard" className="w-full">
                         Customer Dashboard
                       </Link>
                     </DropdownMenuItem>}
                   <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2" size={16} />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> : <div className="flex items-center space-x-3">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                
              </div>}
            
            <a href="https://www.lmvinsurance.com/" target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm">
                Get Quote
              </Button>
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col space-y-4">
              {navItems.map(item => <Link key={item.name} to={item.path} className="text-foreground hover:text-primary transition-colors duration-200 font-medium" onClick={() => setIsMenuOpen(false)}>
                  {item.name}
                </Link>)}
              
              {user ? <div className="space-y-2 pt-2 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    {profile?.first_name} {profile?.last_name}
                  </div>
                   <div className="text-xs text-muted-foreground capitalize">
                     {profile?.role?.replace('_', ' ')}
                   </div>
                   {profile?.role === 'system_admin' && <Link to="/admin-dashboard" onClick={() => setIsMenuOpen(false)}>
                       <Button variant="ghost" size="sm" className="w-full justify-start">
                         Admin Dashboard
                       </Button>
                     </Link>}
                   {profile?.role === 'tenant_admin' && <Link to="/tenant-admin-dashboard" onClick={() => setIsMenuOpen(false)}>
                       <Button variant="ghost" size="sm" className="w-full justify-start">
                         Tenant Dashboard
                       </Button>
                     </Link>}
                   {profile?.role === 'tenant_employee' && <Link to="/employee-dashboard" onClick={() => setIsMenuOpen(false)}>
                       <Button variant="ghost" size="sm" className="w-full justify-start">
                         Employee Dashboard
                       </Button>
                     </Link>}
                   {profile?.role === 'tenant_agent' && <Link to="/agent-dashboard" onClick={() => setIsMenuOpen(false)}>
                       <Button variant="ghost" size="sm" className="w-full justify-start">
                         Agent Dashboard
                       </Button>
                     </Link>}
                   {profile?.role === 'customer' && <Link to="/customer-dashboard" onClick={() => setIsMenuOpen(false)}>
                       <Button variant="ghost" size="sm" className="w-full justify-start">
                         Customer Dashboard
                       </Button>
                     </Link>}
                   <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start text-destructive">
                    <LogOut className="mr-2" size={16} />
                    Sign Out
                  </Button>
                </div> : <div className="space-y-2 pt-2 border-t border-border">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="default" size="sm" className="w-full">
                      Sign Up
                    </Button>
                  </Link>
                </div>}
              
              <a href="https://www.lmvinsurance.com/" target="_blank" rel="noopener noreferrer" className="inline-block w-fit">
                <Button variant="secondary" size="sm">
                  Get Quote
                </Button>
              </a>
            </nav>
          </div>}
      </div>
    </header>;
};
export default Header;