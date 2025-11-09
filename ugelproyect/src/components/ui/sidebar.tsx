// Ruta: @/components/ui/sidebar.tsx

"use client";
import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconX } from "@tabler/icons-react";

// --- PASO 1: HOOK PARA DETECTAR TAMAÑO DE PANTALLA ---
// Este hook nos dice si la pantalla coincide con una media query (ej: si es más grande que 768px).
const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        window.addEventListener("resize", listener);
        return () => window.removeEventListener("resize", listener);
    }, [matches, query]);

    return matches;
};


// --- CONTEXT (No necesita cambios) ---
interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}
const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider");
  return context;
};
export const SidebarProvider = ({ children, open: openProp, setOpen: setOpenProp, animate = true }: { children: React.ReactNode; open?: boolean; setOpen?: React.Dispatch<React.SetStateAction<boolean>>; animate?: boolean; }) => {
  const [openState, setOpenState] = useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : openState;
  return <SidebarContext.Provider value={{ open, setOpen, animate }}>{children}</SidebarContext.Provider>;
};

// --- COMPONENTES PRINCIPALES (Con la corrección clave) ---

export const Sidebar = ({ children, open, setOpen, animate }: { children: React.ReactNode; open?: boolean; setOpen?: React.Dispatch<React.SetStateAction<boolean>>; animate?: boolean; }) => {
  return <SidebarProvider open={open} setOpen={setOpen} animate={animate}>{children}</SidebarProvider>;
};

// --- PASO 2: SIDEBARBODY AHORA USA EL HOOK ---
// Ya no renderiza ambos sidebars, elige uno basado en el tamaño de la pantalla.
export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  const isDesktop = useMediaQuery("(min-width: 768px)"); // 768px es el breakpoint 'md' de Tailwind
  
  if (isDesktop) {
    return <DesktopSidebar {...props} />;
  }
  return <MobileSidebar {...(props as React.ComponentProps<"div">)} />;
};

export const DesktopSidebar = ({ className, children, ...props }: React.ComponentProps<typeof motion.div>) => {
  const { open, animate } = useSidebar();
  return (
    <motion.div
      className={cn("h-full flex flex-col shrink-0 overflow-hidden", className)}
      animate={{ width: animate ? (open ? "300px" : "80px") : "300px" }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({ className, children }: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className={cn("fixed h-full w-[300px] inset-y-0 left-0 z-[100] flex flex-col", className)}
          >
            <div className="absolute right-4 top-4 z-50" onClick={() => setOpen(false)}>
              <IconX className="h-8 w-8 text-slate-300" />
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};


// --- COMPONENTE DE ENLACE (Con soporte para iconos visibles cuando está minimizado) ---
export const SidebarLink = ({
  icon,
  label,
  isActive,
  onClick,
  darkMode = true,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  darkMode?: boolean;
}) => {
  const { open } = useSidebar();
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center py-3 rounded-xl transition-colors duration-200 w-full relative",
        open ? "justify-start gap-4 px-4" : "justify-center px-2",
        darkMode 
          ? (isActive ? "text-white bg-blue-600/30" : "text-neutral-400 hover:text-white hover:bg-neutral-700/50")
          : (isActive ? "text-white bg-blue-600" : "text-blue-700 hover:text-blue-900 hover:bg-blue-50")
      )}
      title={!open ? label : undefined}
    >
      <span className={cn("flex items-center justify-center shrink-0", !open && "mx-auto")}>
        {icon}
      </span>
      <motion.span
        initial={false}
        animate={{ 
          opacity: open ? 1 : 0,
          width: open ? "auto" : 0,
          overflow: "hidden"
        }}
        transition={{ duration: 0.2 }}
        className={cn("text-sm whitespace-pre", !open && "absolute opacity-0 pointer-events-none")}
      >
        {label}
      </motion.span>
    </button>
  );
};