export class AccessDeniedError extends Error {
  constructor(message = 'No tiene permiso para realizar esta acción en este perfil.') {
    super(message);
    this.name = 'AccessDeniedError';
  }
}

export class NotFoundError extends Error {
  constructor(message = 'El registro no existe en el perfil activo.') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  readonly issues: string[];
  constructor(issues: string[]) {
    super(issues.join(' · '));
    this.name = 'ValidationError';
    this.issues = issues;
  }
}
