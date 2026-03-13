const AppFooter = () => (
  <footer className="w-full border-t border-border/40 bg-muted/30 py-6 px-4 mt-auto">
    <div className="max-w-2xl mx-auto text-center space-y-2">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Copyright © {new Date().getFullYear()} Tionna Anderson
      </p>
      <p className="text-xs text-muted-foreground/70 leading-relaxed">
        The TJ Anderson Layer Method™ is a proprietary learning framework created by Tionna Anderson.
        Unauthorized reproduction, distribution, or instructional replication is prohibited.
      </p>
      <a
        href="/terms"
        className="text-xs text-primary hover:underline"
      >
        Terms of Use &amp; Intellectual Property Notice
      </a>
    </div>
  </footer>
);

export default AppFooter;
