"use client"

import { Globe, Navigation as NavIcon } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"

export const Footer = () => {
  const { t } = useTranslations()
  const columns = [
    { titleKey: "footer.col.ecosystem" as const },
    { titleKey: "footer.col.resource" as const },
    { titleKey: "footer.col.company" as const },
  ]
  const links = [
    "footer.link.tutorMap",
    "footer.link.vectorAlgo",
    "footer.link.knowledgeNodes",
    "footer.link.apiAccess",
  ] as const

  return (
    <footer className="bg-[#1E293B] dark:bg-black text-white pt-32 pb-16 border-t border-transparent dark:border-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-24">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-10">
              <div className="bg-[#8B5CF6] p-2 rounded-xl rotate-12">
                <NavIcon className="text-white w-6 h-6" />
              </div>
              <span className="text-3xl font-black tracking-tight">
                Vector<span className="text-[#8B5CF6]">+</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed font-medium mb-10">
              {t("footer.blurb")}
            </p>
            <div className="flex gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#8B5CF6] transition-all cursor-pointer"
                >
                  <Globe className="w-6 h-6 text-white/40" />
                </div>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.titleKey}>
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-[#8B5CF6] mb-10">
                {t(col.titleKey)}
              </h4>
              <ul className="space-y-6 text-slate-400 font-black text-xs tracking-widest">
                {links.map((linkKey) => (
                  <li
                    key={linkKey}
                    className="hover:text-white cursor-pointer transition-colors"
                  >
                    {t(linkKey)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-slate-500 font-black uppercase tracking-[0.4em] text-[10px]">
          <p>{t("footer.copyright")}</p>
          <div className="flex gap-12">
            <span className="hover:text-white cursor-pointer transition-colors">
              {t("footer.privacy")}
            </span>
            <span className="hover:text-white cursor-pointer transition-colors">
              {t("footer.terms")}
            </span>
            <span className="hover:text-white cursor-pointer transition-colors">
              {t("footer.security")}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}