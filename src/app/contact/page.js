'use client';

import { motion } from 'framer-motion';
import {
  Mail,
  MessageSquare,
  Globe,
  ArrowRight,
  ShieldCheck,
  Clock,
  MapPin,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden border-b border-border bg-card/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.05),transparent_50%)]" />
        <div className="container relative mx-auto px-6">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="bg-primary/10 text-primary border-none font-black uppercase tracking-[0.2em] text-[10px] px-4 py-1.5 rounded-full mb-8">
                Connect with Experts
              </Badge>
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 text-foreground leading-none">
                Get in <br />
                <span className="text-primary italic">Touch.</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed font-medium max-w-2xl">
                Have questions about HAZWOPER compliance, tool integration, or
                custom enterprise solutions? Our technical support team is
                standing by to assist your safety operations.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 container mx-auto px-6">
        <div className="grid lg:grid-cols-12 gap-20 items-start">
          {/* Contact Details */}
          <div className="lg:col-span-5 space-y-12">
            <div className="space-y-8">
              <h2 className="text-3xl font-black text-foreground">
                Communication Hub
              </h2>
              <p className="text-muted-foreground font-medium leading-relaxed">
                We prioritize high-speed responses for industrial compliance
                inquiries. Expect a response within 2-4 business hours for all
                priority documentation requests.
              </p>
            </div>

            <div className="space-y-6">
              {[
                {
                  label: 'General Inquiries',
                  val: 'bilalghaffar46@gmail.com',
                  icon: Mail,
                  color: 'text-blue-500',
                },
                {
                  label: 'Technical Support',
                  val: 'support@hazwoper-useful-tools.com',
                  icon: MessageSquare,
                  color: 'text-primary',
                },
                {
                  label: 'Global HQ',
                  val: 'Secure Cloud Infrastructure',
                  icon: MapPin,
                  color: 'text-emerald-500',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex gap-6 p-6 rounded-3xl bg-card border border-border group hover:border-primary/30 transition-all"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center ${item.color} group-hover:bg-primary group-hover:text-white transition-all`}
                  >
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="font-bold text-foreground">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 rounded-[40px] bg-primary/5 border border-primary/10 space-y-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-primary" />
                <h4 className="font-black text-foreground uppercase tracking-tight">
                  Encrypted Channel
                </h4>
              </div>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                All communications through our official channels are encrypted.
                We treat your proprietary safety protocols with absolute
                confidentiality and industrial-grade security.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7 bg-card border border-border rounded-[50px] p-8 md:p-16 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl -z-10" />

            <form
              className="space-y-8 relative z-10"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Full Name
                  </label>
                  <Input
                    placeholder="John Doe"
                    className="h-14 rounded-2xl bg-background border-border/50 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Email Address
                  </label>
                  <Input
                    placeholder="john@company.com"
                    type="email"
                    className="h-14 rounded-2xl bg-background border-border/50 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Subject
                </label>
                <Input
                  placeholder="HAZWOPER Content Integration"
                  className="h-14 rounded-2xl bg-background border-border/50 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Message
                </label>
                <Textarea
                  placeholder="How can we help your safety team today?"
                  className="min-h-[150px] rounded-2xl bg-background border-border/50 focus:ring-primary p-4"
                />
              </div>

              <Button
                size="lg"
                className="h-16 w-full rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/40 group"
              >
                Dispatch Message
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>

              <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] pt-4">
                <Clock className="w-4 h-4" />
                Response Time: ~4 Hours
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
