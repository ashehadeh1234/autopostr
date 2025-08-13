import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Database, Users, Lock, Eye, FileText, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-secondary/30 border-b">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
            <p className="text-xl text-muted-foreground">
              How AutoPostr collects, uses, and protects your information
            </p>
            <p className="text-sm text-muted-foreground">
              Last updated: January 2025
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-lg max-w-none space-y-12">
          
          {/* Introduction */}
          <section className="space-y-4">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">Our Commitment to Your Privacy</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              At AutoPostr, we respect your privacy and are committed to protecting your personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when 
              you use our social media automation platform.
            </p>
          </section>

          {/* Data Collection */}
          <section className="space-y-6">
            <div className="flex items-center space-x-3">
              <Database className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">Information We Collect</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Account Information</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Email address and password for account creation</li>
                  <li>• Profile information (name, profile picture) when provided</li>
                  <li>• Account preferences and settings</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Social Media Connection Data</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• OAuth tokens and permissions for connected social media accounts</li>
                  <li>• Facebook and Instagram page information and access tokens</li>
                  <li>• Platform usernames and basic profile information</li>
                  <li>• Posting permissions and capabilities</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Content and Files</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Images, videos, and other media files you upload</li>
                  <li>• AI-generated captions and content descriptions</li>
                  <li>• Post scheduling information and metadata</li>
                  <li>• Content library organization and rotation settings</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Usage Analytics</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Platform usage patterns and feature interactions</li>
                  <li>• Post performance and engagement metrics</li>
                  <li>• Error logs and diagnostic information</li>
                  <li>• Session duration and activity timestamps</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Usage */}
          <section className="space-y-6">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">How We Use Your Information</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Service Provision</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Authenticate and manage your account access</li>
                  <li>• Connect and manage your social media accounts</li>
                  <li>• Generate AI-powered captions for your content</li>
                  <li>• Schedule and publish posts to your connected platforms</li>
                  <li>• Store and organize your content library</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Platform Improvement</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Analyze usage patterns to improve our services</li>
                  <li>• Develop new features and capabilities</li>
                  <li>• Provide customer support and troubleshooting</li>
                  <li>• Ensure platform security and prevent abuse</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Communications</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Send important account and service updates</li>
                  <li>• Provide customer support responses</li>
                  <li>• Notify you of posting status and results</li>
                  <li>• Share product updates and new features (with opt-out available)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Storage & Security */}
          <section className="space-y-6">
            <div className="flex items-center space-x-3">
              <Lock className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">Data Storage & Security</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Infrastructure</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Data is stored securely using Supabase's PostgreSQL infrastructure</li>
                  <li>• Files are stored in encrypted cloud storage with access controls</li>
                  <li>• All data transmission is encrypted using industry-standard TLS</li>
                  <li>• Regular security audits and vulnerability assessments</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Access Controls</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Row-level security policies ensure users only access their own data</li>
                  <li>• Social media tokens are encrypted and stored securely</li>
                  <li>• Administrative access is limited and logged</li>
                  <li>• Regular access reviews and permission audits</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Data Retention</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Account data is retained while your account is active</li>
                  <li>• Uploaded content is stored until you delete it or close your account</li>
                  <li>• Social media tokens are refreshed automatically and deleted upon disconnection</li>
                  <li>• Analytics data may be retained in aggregated, anonymized form</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Third-Party Services */}
          <section className="space-y-6">
            <div className="flex items-center space-x-3">
              <Eye className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">Third-Party Services</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Social Media Platforms</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• <strong>Facebook/Meta:</strong> Used for posting to Facebook pages and Instagram business accounts</li>
                  <li>• We only access permissions you explicitly grant during connection</li>
                  <li>• Your social media data is subject to the respective platform's privacy policies</li>
                  <li>• You can revoke access directly from your social media account settings</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Backend Services</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• <strong>Supabase:</strong> Provides database, authentication, and file storage services</li>
                  <li>• <strong>AI Services:</strong> Content analysis and caption generation (data is not stored by AI providers)</li>
                  <li>• All third-party services are bound by strict data processing agreements</li>
                </ul>
              </div>
            </div>
          </section>

          {/* User Rights */}
          <section className="space-y-6">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">Your Rights and Choices</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Data Access and Control</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• <strong>Access:</strong> View and download your personal data at any time</li>
                  <li>• <strong>Correction:</strong> Update or correct your account information</li>
                  <li>• <strong>Deletion:</strong> Delete specific content or your entire account</li>
                  <li>• <strong>Portability:</strong> Export your data in a standard format</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Social Media Connections</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Disconnect social media accounts at any time from the Connections page</li>
                  <li>• Disable auto-posting while keeping connections active</li>
                  <li>• Revoke permissions directly from your social media account settings</li>
                  <li>• Data from disconnected accounts is immediately inaccessible to AutoPostr</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Communication Preferences</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Opt out of promotional emails while keeping essential service notifications</li>
                  <li>• Control posting notification frequency and channels</li>
                  <li>• Choose which updates and alerts you receive</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Legal Compliance */}
          <section className="space-y-6">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">Legal Compliance</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">GDPR Compliance (EU Users)</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Lawful basis for processing: Contract performance and legitimate interests</li>
                  <li>• Right to erasure: Delete your data upon request</li>
                  <li>• Data portability: Export your data in machine-readable format</li>
                  <li>• Processing transparency: Clear information about how we use your data</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">CCPA Compliance (California Users)</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Right to know what personal information is collected and how it's used</li>
                  <li>• Right to delete personal information (with certain exceptions)</li>
                  <li>• Right to opt-out of sale (note: we do not sell personal information)</li>
                  <li>• Non-discrimination for exercising privacy rights</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Deletion Requests */}
          <section className="space-y-6">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">Data Deletion Requests</h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-muted-foreground">
                You have the right to request deletion of your personal data at any time. To request deletion 
                of your account and all associated data:
              </p>
              
              <div className="bg-secondary/50 rounded-lg p-6 space-y-4">
                <div>
                  <strong>Data Deletion URL:</strong> 
                  <a href="mailto:privacy@autopostr.com?subject=Data%20Deletion%20Request&body=I%20request%20deletion%20of%20my%20account%20and%20all%20associated%20data.%20My%20account%20email:%20" 
                     className="text-primary hover:underline ml-2">
                    privacy@autopostr.com
                  </a>
                </div>
                <div className="text-sm text-muted-foreground">
                  <strong>What happens when you request deletion:</strong>
                  <ul className="mt-2 space-y-1 ml-4">
                    <li>• Your account will be permanently deleted</li>
                    <li>• All uploaded content and files will be removed</li>
                    <li>• Social media connections will be disconnected</li>
                    <li>• All personal data will be permanently erased within 30 days</li>
                  </ul>
                </div>
                <div className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Some data may be retained in anonymized form for analytics purposes 
                  or as required by law.
                </div>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="space-y-6">
            <div className="flex items-center space-x-3">
              <Mail className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">Contact Us</h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-muted-foreground">
                If you have questions about this Privacy Policy or wish to exercise your privacy rights, 
                please contact us:
              </p>
              
              <div className="bg-secondary/50 rounded-lg p-6 space-y-3">
                <div>
                  <strong>Email:</strong> <a href="mailto:privacy@autopostr.com" className="text-primary hover:underline">privacy@autopostr.com</a>
                </div>
                <div>
                  <strong>Support:</strong> <a href="mailto:support@autopostr.com" className="text-primary hover:underline">support@autopostr.com</a>
                </div>
                <div>
                  <strong>Response Time:</strong> We respond to privacy requests within 30 days
                </div>
              </div>
            </div>
          </section>

          {/* Changes to Policy */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time to reflect changes in our practices 
              or applicable laws. We will notify you of material changes by email or through a prominent 
              notice in our application. Your continued use of AutoPostr after such notice constitutes 
              acceptance of the updated Privacy Policy.
            </p>
          </section>

        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;