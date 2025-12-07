import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Target, Users } from "lucide-react";

const About = () => {
  return (
    <Layout>
      <div className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-secondary text-white py-20">
          <div className="container-custom text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 font-heading">
              About TRUE NESTER
            </h1>
            <p className="text-lg text-white/90 max-w-3xl mx-auto">
              Dubai's premier property agency connecting Indian investors with luxury developer projects
            </p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20 bg-background">
          <div className="container-custom">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary mx-auto mb-6 flex items-center justify-center">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">Our Mission</h3>
                  <p className="text-muted-foreground">
                    To bridge the India-Dubai property corridor and provide seamless investment opportunities in premium real estate
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary mx-auto mb-6 flex items-center justify-center">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">Our Values</h3>
                  <p className="text-muted-foreground">
                    Transparency, trust, and excellence in every property transaction. Your satisfaction is our success
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary mx-auto mb-6 flex items-center justify-center">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">Our Expertise</h3>
                  <p className="text-muted-foreground">
                    Years of experience in Dubai real estate with deep understanding of Indian investor needs
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Company Story */}
        <section className="py-20 bg-muted/30">
          <div className="container-custom max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 font-heading">
                Our <span className="text-gradient-primary">Story</span>
              </h2>
            </div>
            <div className="space-y-6 text-muted-foreground">
              <p>
                TRUE NESTER was founded with a vision to make Dubai property investment accessible and transparent for Indian investors. We recognized the growing interest among Indian buyers in Dubai's thriving real estate market and saw an opportunity to bridge the gap between investors and premier developers.
              </p>
              <p>
                Our deep partnerships with Dubai's most prestigious developers like Emaar, Damac, and Nakheel enable us to offer exclusive access to the finest properties in the emirate. From luxury apartments in Downtown Dubai to beachfront villas on Palm Jumeirah, we curate properties that match our clients' investment goals and lifestyle aspirations.
              </p>
              <p>
                What sets us apart is our commitment to understanding the unique needs of Indian investors - from currency considerations and payment plans to legal guidance and post-purchase support. We provide end-to-end assistance in multiple languages, ensuring a seamless experience from property search to final handover.
              </p>
              <p>
                Today, TRUE NESTER has helped over 1,000 families realize their Dubai property dreams, with a portfolio spanning across all major locations in the emirate. Our success is measured not just in transactions, but in the lasting relationships we build with our clients.
              </p>
            </div>
          </div>
        </section>

        {/* Certifications */}
        <section className="py-20 bg-background">
          <div className="container-custom text-center">
            <h2 className="text-3xl font-bold mb-12 font-heading">
              Certifications & <span className="text-gradient-primary">Partnerships</span>
            </h2>
            <div className="flex flex-wrap justify-center gap-8">
              {["RERA Certified - 1226696", "Broker Card - 45112", "Damac Elite", "BINGHATTI Preferred"].map((cert, index) => (
                <div
                  key={index}
                  className="w-32 h-32 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center font-semibold text-center p-4 shadow-md"
                >
                  {cert}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default About;
