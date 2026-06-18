import { Heart, Shield } from "lucide-react";

interface FooterProps {
    onToggleAdmin: () => void;
    isAdminOpen: boolean;
}

export default function Footer({ onToggleAdmin, isAdminOpen }: FooterProps) {
    return (
        <footer className="w-full bg-nat-heading text-[#A6A098] py-10 transition-colors">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-between gap-6 sm:flex-row text-center sm:text-left">
                    <div>
                        <div className="font-serif text-lg font-bold text-white tracking-tight">
                            She Can Foundation
                        </div>
                        <p className="mt-1 text-xs text-[#8E877F] max-w-md leading-relaxed">
                            Empowering girls and women globally with technical
                            resources, digital skills training, and direct
                            career-support ecosystems.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-semibold uppercase tracking-wider text-[#A6A098]">
                        <a
                            href="#about"
                            className="hover:text-white transition-colors"
                        >
                            Our Mission
                        </a>
                        <a
                            href="#initiatives"
                            className="hover:text-white transition-colors"
                        >
                            Digital Scholars
                        </a>
                        <span
                            onClick={onToggleAdmin}
                            className="inline-flex cursor-pointer items-center space-x-1.5 text-[#8E877F] hover:text-white transition-colors"
                        >
                            <Shield className="h-3 w-3" />
                            <span>
                                {isAdminOpen ? "Form Page" : "Admin Panel"}
                            </span>
                        </span>
                    </div>
                </div>

                <hr className="my-6 border-[#3D3A36]" />

                <div className="flex flex-col items-center sm:items-end">
                    <p className="flex items-center gap-1.5 normal-case tracking-normal">
                        <span>Powering women in technology with</span>
                        <Heart className="h-3 w-3 text-nat-terracotta fill-nat-terracotta animate-pulse" />
                    </p>

                    <p className="mt-2 text-[11px] normal-case text-[#A6A098]">
                        Made by Meghnath Marndi
                    </p>

                    <p className="text-[11px] normal-case text-[#A6A098]">
                        GitHub: SONU2004129
                    </p>

                    <p className="text-[11px] normal-case text-[#A6A098]">
                        meghnathmarndi@gmail.com
                    </p>
                </div>
            </div>
        </footer>
    );
}
