declare module 'ubigeo-peru' {
  interface UbigeoItem {
    departamento: string;
    provincia: string;
    distrito: string;
    nombre: string;
  }

  interface UbigeoData {
    reniec: UbigeoItem[];
    inei: UbigeoItem[];
  }

  const ubigeo: UbigeoData;
  export default ubigeo;
}

