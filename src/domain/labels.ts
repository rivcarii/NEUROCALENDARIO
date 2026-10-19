export const RECOVERY_LABEL: Record<string, string> = {
  completa: 'Recuperación completa', parcial: 'Recuperación parcial',
  sin_recuperar: 'Sin recuperar', desconocida: 'No indicado',
};

/** Catálogo inicial de tipos de episodio/síntoma (el usuario puede escribir otros). */
export const EPISODE_KINDS = [
  'Cefalea', 'Mareo / vértigo', 'Temblor', 'Convulsión', 'Pérdida de conciencia',
  'Debilidad', 'Hormigueo / entumecimiento', 'Alteración visual', 'Alteración del habla',
  'Confusión / desorientación', 'Pérdida de memoria', 'Fatiga intensa', 'Otro',
];

export const ASSOCIATED_SYMPTOMS = [
  'Náusea', 'Vómito', 'Sensibilidad a la luz', 'Sensibilidad al ruido', 'Aura visual',
  'Sudoración', 'Palpitaciones', 'Ansiedad', 'Somnolencia', 'Dolor de cuello',
];

export const LEVEL_LABEL = { read: 'Solo lectura', write: 'Lectura y escritura', admin: 'Administrador' } as const;
export const WEEKDAY_LABEL = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const PROFILE_COLORS = ['#2F5D8A', '#8A2F5D', '#1F7A4D', '#8A5D2F', '#5D2F8A', '#2F7A8A'];
