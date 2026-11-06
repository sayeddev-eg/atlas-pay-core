declare module 'passport-jwt' {
  export const Strategy: any;
  export const ExtractJwt: {
    fromAuthHeaderAsBearerToken: () => any;
    fromHeader: (header_name: string) => any;
    fromBodyField: (field_name: string) => any;
    fromUrlQueryParameter: (param_name: string) => any;
  };
}
