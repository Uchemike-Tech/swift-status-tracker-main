import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <img src={logo} alt="Swift Payment Tracker" className="h-10 mb-6" />
      <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
      <p className="text-muted-foreground mb-6">The page you're looking for doesn't exist.</p>
      <Button asChild>
        <Link to="/">Go Home</Link>
      </Button>
    </div>
  );
};

export default NotFound;
