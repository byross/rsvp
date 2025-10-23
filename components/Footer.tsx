export default function Footer() {
  return (
    <footer className="w-full border-t bg-white/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()}</span>
            <a 
              href="https://byross.mo" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium text-slate-900 hover:text-blue-600 transition-colors"
            >
              byRoss Design and Tech
            </a>
          </div>
          <div className="text-xs text-slate-500">
            byRoss RSVP V1.0
          </div>
        </div>
      </div>
    </footer>
  );
}




