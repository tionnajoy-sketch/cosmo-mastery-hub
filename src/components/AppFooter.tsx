const AppFooter = () => (
  <footer className="w-full border-t border-border/40 bg-muted/30 py-6 px-4 mt-auto">
    <div className="max-w-2xl mx-auto text-center space-y-2">
      <p className="text-xs text-muted-foreground leading-relaxed">
        © {new Date().getFullYear()} Tionna Joy Anderson. All Rights Reserved.
      </p>
      <p className="text-xs text-muted-foreground/70 leading-relaxed">
        CosmoPrep™ and the TJ Anderson Layer Method™ are proprietary trademarks.
        Content may not be reproduced, distributed, or transmitted without prior written permission.
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
