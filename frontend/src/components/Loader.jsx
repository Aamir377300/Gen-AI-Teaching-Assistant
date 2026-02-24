import { Loader2 } from "lucide-react";

const Loader = ({ text = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-12">
    <Loader2 className="h-8 w-8 animate-spin-slow text-primary" />
    <p className="text-sm text-muted-foreground">{text}</p>
  </div>
);

export default Loader;
