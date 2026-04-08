import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AppFooter from "@/components/AppFooter";

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center gap-2 px-4 py-4 max-w-3xl mx-auto w-full">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </header>

      <main className="flex-1 px-4 pb-12 max-w-3xl mx-auto w-full">
        <h1 className="font-display text-3xl font-bold text-foreground mb-6">
          Terms of Use &amp; Intellectual Property Notice
        </h1>

        <div className="prose prose-sm max-w-none text-foreground/80 space-y-6">
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">1. Ownership &amp; Copyright</h2>
            <p>
              All content, curriculum, study materials, questions, metaphors, affirmations, and educational
              frameworks within CosmoPrep™ are the exclusive intellectual property of Tionna Joy Anderson
              ("the Author"). This includes, but is not limited to, the TJ Anderson Layer Method™: Core Cross Agent™, all
              original definitions, metaphors, affirmations, quiz questions, and supporting content.
            </p>
            <p>
              © {new Date().getFullYear()} Tionna Joy Anderson. All Rights Reserved.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">2. Permitted Use</h2>
            <p>
              Your subscription grants you a personal, non-transferable, non-exclusive license to access
              and use CosmoPrep™ for your own educational purposes only. You may not share your account
              credentials with any other person.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">3. Prohibited Activities</h2>
            <p>You expressly agree NOT to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Copy, reproduce, distribute, or transmit any content from CosmoPrep™</li>
              <li>Take screenshots, screen recordings, or photographs of content for commercial use or redistribution</li>
              <li>Create derivative works based on the TJ Anderson Layer Method™: Core Cross Agent™ or any CosmoPrep™ materials</li>
              <li>Reverse engineer, decompile, or attempt to extract the source code of the application</li>
              <li>Share, resell, or sublicense access to any part of the platform</li>
              <li>Use any content for the purpose of training artificial intelligence models</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">4. Trademark Notice</h2>
            <p>
              "CosmoPrep," "TJ Anderson Layer Method," and "Core Cross Agent" are trademarks of Tionna Joy Anderson.
              Unauthorized use of these marks is strictly prohibited and may result in legal action.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">5. DMCA Notice</h2>
            <p>
              If you believe that content available through CosmoPrep™ infringes your copyright, or if
              you discover unauthorized reproduction of CosmoPrep™ content elsewhere, please contact
              the Author immediately. We take intellectual property protection seriously and will pursue
              all available legal remedies against unauthorized use.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">6. Disclaimer</h2>
            <p>
              CosmoPrep™ is a study aid designed to supplement your cosmetology education. It does not
              guarantee passage of any state board examination. Results depend on individual effort,
              preparation, and other factors beyond our control. The content is provided "as is" without
              warranties of any kind.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">7. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with the laws of the
              United States. Any disputes arising from or relating to these terms shall be resolved
              in the appropriate courts of the Author's jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">8. Amendments</h2>
            <p>
              The Author reserves the right to modify these terms at any time. Continued use of
              CosmoPrep™ after changes constitutes acceptance of the revised terms.
            </p>
          </section>
        </div>
      </main>

      <AppFooter />
    </div>
  );
};

export default TermsPage;
