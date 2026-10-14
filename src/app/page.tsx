import Link from "next/link";
import { Camera, ChartColumn, Globe, Shield } from "lucide-react";
import * as motion from "motion/react-client";

import { ReportFeatureCard } from "@/components/home/report-feature-card";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/session";

const primaryButton =
  "bg-red-600 hover:bg-red-700 text-white font-semibold text-lg px-8 py-6 transition-all duration-300 hover:scale-105 shadow-lg";
const secondaryButton =
  "border-white text-black hover:bg-white/15 font-semibold text-lg px-8 py-6 transition-all duration-300 hover:scale-105";

const featureVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const featureCard =
  "flex flex-col flex-1 items-center space-y-4 border border-red-200 p-6 rounded-xl bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-2 group min-h-[240px] min-w-0";

function FeatureBody({
  icon,
  title,
  text,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  action: string;
}) {
  return (
    <>
      <div className="p-3 bg-red-100 rounded-full group-hover:bg-red-200 transition-colors duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold group-hover:text-red-600 transition-colors duration-300">
        {title}
      </h3>
      <p className="text-center font-light">{text}</p>
      <span className="text-red-600 font-medium group-hover:underline transition-all duration-300">
        {action} &gt;
      </span>
    </>
  );
}

export default async function Home() {
  const user = await getSessionUser();
  const isAdmin = user?.role === "ADMIN";

  // The main call to action depends on who is looking.
  const primaryAction = isAdmin
    ? { href: "/admin/dashboard", label: "Admin Dashboard" }
    : user
      ? { href: "/reports/new", label: "Report Crime" }
      : { href: "/reports/anonymous", label: "Report Anonymously" };

  return (
    <div className="flex min-h-screen flex-col">
      <section
        className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-cover bg-center relative overflow-hidden"
        style={{ backgroundImage: "linear-gradient(135deg, #0a192f 0%, #172a45 100%)" }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/dark-stripes.png')] opacity-10"></div>
        </div>

        <div className="max-w-[95%] mx-auto relative z-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col justify-center space-y-4"
            >
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter text-white sm:text-5xl xl:text-6xl leading-tight">
                  <span className="text-red-500">Contribute</span> to a Safer Community
                </h1>
                <p className="max-w-[600px] text-gray-300 md:text-xl text-lg">
                  Report incidents, track crime patterns, and help make our neighborhood safer for
                  everyone. Anonymous reporting available.
                </p>
              </div>
              <div className="flex flex-col gap-4 min-[400px]:flex-row pt-4">
                <Button asChild size="lg" className={primaryButton}>
                  <Link href={primaryAction.href}>{primaryAction.label}</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className={secondaryButton}>
                  <Link href="/reports/map">View Crime Map</Link>
                </Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex items-center justify-center"
            >
              <div className="relative w-full h-64 lg:h-96">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/50 rounded-xl"></div>
                <div className="absolute inset-4 border-2 border-red-500/50 rounded-lg"></div>
                <div className="absolute inset-8 flex items-center justify-center">
                  <Shield className="text-red-500/50 h-40 w-40" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32 bg-white max-w-[95%] mx-auto">
        <div className="px-4 md:px-6">
          <motion.div
            className="flex flex-col items-center justify-center space-y-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.5 }}
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Key <span className="text-red-600">Features</span>
              </h2>
              <p className="max-w-[900px] md:text-xl/relaxed font-light">
                Our platform offers powerful tools to keep you informed and communities safe
              </p>
            </div>
          </motion.div>

          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
          >
            <motion.div variants={featureVariants} className="flex flex-col h-full">
              <ReportFeatureCard blocked={isAdmin}>
                <FeatureBody
                  icon={<Camera className="h-8 w-8 text-red-600" />}
                  title="AI-Powered Reports"
                  text="Report incidents anonymously with AI-powered text extraction from images."
                  action="Report Anonymously"
                />
              </ReportFeatureCard>
            </motion.div>
            <motion.div variants={featureVariants} className="flex flex-col h-full">
              <Link href="/reports/map" className={featureCard}>
                <FeatureBody
                  icon={<Globe className="h-8 w-8 text-red-600" />}
                  title="Interactive Map"
                  text="Visualize crime hotspots and incidents in your neighborhood on an interactive map."
                  action="View Map"
                />
              </Link>
            </motion.div>
            <motion.div variants={featureVariants} className="flex flex-col h-full">
              <Link href="/stats" className={featureCard}>
                <FeatureBody
                  icon={<ChartColumn className="h-8 w-8 text-red-600" />}
                  title="Statistics"
                  text="Explore crime statistics and trends in your area."
                  action="View Statistics"
                />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
