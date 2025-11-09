"use client"

import * as React from "react"
import {
  IconFileDescription,
  IconUsers,
  IconSearch,
  IconChartBar,
  IconReport,
  IconDatabase,
  IconSettings,
  IconHelp,
  IconInnerShadowTop,
  IconFolder,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/ui/nav-documents"
import { NavMain } from "@/components/ui/nav-main"
import { NavSecondary } from "@/components/ui/nav-secondary"
import { NavUser } from "@/components/ui/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Datos del sistema de Evaluador de CV
const data = {
  user: {
    name: "Administrador",
    email: "admin@evaluadorcv.com",
    avatar: "/avatars/admin.jpg",
  },
  // Menú principal
  navMain: [
    {
      title: "Panel General",
      url: "#",
      icon: IconFolder,
    },
    {
      title: "Postulantes",
      url: "#",
      icon: IconUsers,
    },
    {
      title: "Evaluación de CVs",
      url: "#",
      icon: IconFileDescription,
    },
    {
      title: "Estadísticas",
      url: "#",
      icon: IconChartBar,
    },
  ],
  // Documentos o secciones relacionadas
  documents: [
    {
      name: "Base de Datos",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Reportes",
      url: "#",
      icon: IconReport,
    },
  ],
  // Menú secundario
  navSecondary: [
    {
      title: "Configuración",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Ayuda",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Buscar",
      url: "#",
      icon: IconSearch,
    },
  ],
}

// Componente de la barra lateral
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {/* Encabezado con logo/nombre */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Evaluador de CV</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Contenido de navegación */}
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>

      {/* Usuario administrador */}
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
