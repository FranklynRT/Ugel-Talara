import { useState, useEffect } from 'react';

interface UserBlockStatus {
  isBlocked: boolean;
  convocatoriaId: string | null;
  blockTimestamp: number | null;
  reason: string;
}

export const useUserBlockStatus = (): UserBlockStatus => {
  const [blockStatus, setBlockStatus] = useState<UserBlockStatus>({
    isBlocked: false,
    convocatoriaId: null,
    blockTimestamp: null,
    reason: ''
  });

  useEffect(() => {
    const checkBlockStatus = async () => {
      const blockedConvocatoriaId = localStorage.getItem('userBlockedUntilConvocatoriaDisabled');
      const blockTimestamp = localStorage.getItem('userBlockedTimestamp');
      
      if (blockedConvocatoriaId && blockTimestamp) {
        console.log(`🔍 Verificando estado de bloqueo para convocatoria: ${blockedConvocatoriaId}`);
        
        // Verificar si la convocatoria específica ha sido deshabilitada
        try {
          const response = await fetch(`http://localhost:9000/ugel-talara/convocatorias/${blockedConvocatoriaId}/verificar-deshabilitada`);
          const data = await response.json();
          
          if (data.isDeshabilitada) {
            // La convocatoria específica ha sido deshabilitada, desbloquear usuario
            console.log(`✅ Convocatoria ${blockedConvocatoriaId} deshabilitada. Desbloqueando usuario.`);
            clearUserBlock();
            setBlockStatus({
              isBlocked: false,
              convocatoriaId: null,
              blockTimestamp: null,
              reason: ''
            });
            return;
          } else {
            console.log(`🔒 Convocatoria ${blockedConvocatoriaId} sigue activa. Usuario permanece bloqueado.`);
          }
        } catch (error) {
          console.error('Error verificando estado de convocatoria:', error);
          // En caso de error, mantener el bloqueo por seguridad
          console.log(`⚠️ Error verificando convocatoria, manteniendo bloqueo por seguridad.`);
        }
        
        setBlockStatus({
          isBlocked: true,
          convocatoriaId: blockedConvocatoriaId,
          blockTimestamp: parseInt(blockTimestamp),
          reason: `Tu cuenta está bloqueada hasta que la convocatoria ${blockedConvocatoriaId} sea deshabilitada.`
        });
      } else {
        setBlockStatus({
          isBlocked: false,
          convocatoriaId: null,
          blockTimestamp: null,
          reason: ''
        });
      }
    };

    // Verificar inmediatamente al cargar
    checkBlockStatus();
    
    // Verificar cada 30 segundos si el usuario sigue bloqueado
    const interval = setInterval(checkBlockStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return blockStatus;
};

export const clearUserBlock = () => {
  localStorage.removeItem('userBlockedUntilConvocatoriaDisabled');
  localStorage.removeItem('userBlockedTimestamp');
};

export const setUserBlock = (convocatoriaId: string) => {
  localStorage.setItem('userBlockedUntilConvocatoriaDisabled', convocatoriaId);
  localStorage.setItem('userBlockedTimestamp', Date.now().toString());
};
