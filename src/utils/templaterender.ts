/**
 * Replaces all occurrences of {{variable}} in the template with the corresponding value from the variables object.
 */
export function renderTemplate(
    template: string,
    variables: { [key: string]: any }
  ): string {
    return template.replace(/{{\s*([\w.-]+)\s*}}/g, (_, key) => variables[key]?.toString() || '');
  }
  