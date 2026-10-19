export const RECOVERY_LABEL: Record<string, string> = {
  completa: 'Quedó bien', parcial: 'Mejoró, pero no del todo',
  sin_recuperar: 'Sigue mal', desconocida: 'No anotado',
};

/** Catálogo inicial de tipos de episodio/síntoma (el usuario puede escribir otros). */
export const EPISODE_KINDS = [
  'Dolor de cabeza', 'Mareo', 'Temblor', 'Convulsión', 'Desmayo',
  'Debilidad', 'Hormigueo o adormecimiento', 'Visión borrosa o doble', 'Dificultad para hablar',
  'Confusión', 'Olvidos', 'Mucho cansancio', 'Otro',
];

export const ASSOCIATED_SYMPTOMS = [
  'Náuseas', 'Vómitos', 'Molestia con la luz', 'Molestia con el ruido', 'Luces o manchas en la vista',
  'Sudor', 'Latidos fuertes', 'Nervios', 'Mucho sueño', 'Dolor de cuello',
];

export const LEVEL_LABEL = { read: 'Solo puede ver', write: 'Puede ver y anotar', admin: 'Administra' } as const;
export const WEEKDAY_LABEL = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const PROFILE_COLORS = ['#2F5D8A', '#8A2F5D', '#1F7A4D', '#8A5D2F', '#5D2F8A', '#2F7A8A'];

export const INTAKE_LABEL: Record<string, string> = { tomada: 'La tomé', omitida: 'No la tomé', pospuesta: 'La dejé para después' };
