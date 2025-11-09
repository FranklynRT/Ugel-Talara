import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      
      {/* Ingresos Totales */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Ingresos Totales</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            $1,250.00
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Tendencia positiva este mes <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Visitantes en los últimos 6 meses
          </div>
        </CardFooter>
      </Card>

      {/* Nuevos Clientes */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Nuevos Clientes</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            1,234
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              -20%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Disminuyó un 20% en este período{" "}
            <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">
            La adquisición requiere atención
          </div>
        </CardFooter>
      </Card>

      {/* Cuentas Activas */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Cuentas Activas</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            45,678
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Alta retención de usuarios <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            El compromiso supera los objetivos
          </div>
        </CardFooter>
      </Card>

      {/* Tasa de Crecimiento */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Tasa de Crecimiento</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            4.5%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +4.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Rendimiento en aumento{" "}
            <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Cumple con las proyecciones de crecimiento
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
