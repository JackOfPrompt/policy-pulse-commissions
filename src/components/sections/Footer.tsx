export function Footer() {
  return (
    <footer id="contact" className="border-t mt-16">
      <div className="container py-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        <nav>
          <h3 className="font-medium mb-3">Links</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li><a href="#about" className="hover:underline">About</a></li>
            <li><a href="#privacy" className="hover:underline">Privacy</a></li>
            <li><a href="#terms" className="hover:underline">Terms</a></li>
            <li><a href="#support" className="hover:underline">Support</a></li>
          </ul>
        </nav>
        <address className="not-italic">
          <h3 className="font-medium mb-3">Contact</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>📞 7680087434</li>
            <li>✉️ info@lakshithatech.com</li>
            <li>🌐 www.lakshithatech.com</li>
          </ul>
        </address>
        <div className="flex items-end md:items-start justify-between md:justify-end">
          <p className="text-muted-foreground">© LakshithaTech 2024–25</p>
        </div>
      </div>
    </footer>
  );
}
