// Datos de ubicaciones de Perú - Departamentos, Provincias y Distritos
export interface Location {
  id: string;
  name: string;
  code?: string;
}

export interface Provincia extends Location {
  distritos: Location[];
}

export interface Departamento extends Location {
  provincias: Provincia[];
}

export const peruLocations: Departamento[] = [
  {
    id: "01",
    name: "Amazonas",
    code: "AMA",
    provincias: [
      {
        id: "0101",
        name: "Chachapoyas",
        code: "CHA",
        distritos: [
          { id: "010101", name: "Chachapoyas" },
          { id: "010102", name: "Asunción" },
          { id: "010103", name: "Balsas" },
          { id: "010104", name: "Cheto" },
          { id: "010105", name: "Chiliquín" },
          { id: "010106", name: "Chuquibamba" },
          { id: "010107", name: "Granada" },
          { id: "010108", name: "Huancas" },
          { id: "010109", name: "La Jalca" },
          { id: "010110", name: "Leimebamba" },
          { id: "010111", name: "Levanto" },
          { id: "010112", name: "Magdalena" },
          { id: "010113", name: "Mariscal Castilla" },
          { id: "010114", name: "Molinopampa" },
          { id: "010115", name: "Montevideo" },
          { id: "010116", name: "Olleros" },
          { id: "010117", name: "Quinjalca" },
          { id: "010118", name: "San Francisco de Daguas" },
          { id: "010119", name: "San Isidro de Maino" },
          { id: "010120", name: "Soloco" },
          { id: "010121", name: "Sonche" }
        ]
      },
      {
        id: "0102",
        name: "Bagua",
        code: "BAG",
        distritos: [
          { id: "010201", name: "Bagua" },
          { id: "010202", name: "Aramango" },
          { id: "010203", name: "Copallín" },
          { id: "010204", name: "El Parco" },
          { id: "010205", name: "Imaza" },
          { id: "010206", name: "La Peca" }
        ]
      },
      {
        id: "0103",
        name: "Bongará",
        code: "BON",
        distritos: [
          { id: "010301", name: "Jumbilla" },
          { id: "010302", name: "Chisquilla" },
          { id: "010303", name: "Churuja" },
          { id: "010304", name: "Corosha" },
          { id: "010305", name: "Cuispes" },
          { id: "010306", name: "Florida" },
          { id: "010307", name: "Jazán" },
          { id: "010308", name: "Recta" },
          { id: "010309", name: "San Carlos" },
          { id: "010310", name: "Shipasbamba" },
          { id: "010311", name: "Valera" },
          { id: "010312", name: "Yambrasbamba" }
        ]
      },
      {
        id: "0104",
        name: "Condorcanqui",
        code: "CON",
        distritos: [
          { id: "010401", name: "Santa María de Nieva" },
          { id: "010402", name: "El Cenepa" },
          { id: "010403", name: "Río Santiago" }
        ]
      },
      {
        id: "0105",
        name: "Luya",
        code: "LUY",
        distritos: [
          { id: "010501", name: "Lamud" },
          { id: "010502", name: "Camporredondo" },
          { id: "010503", name: "Cocabamba" },
          { id: "010504", name: "Colcamar" },
          { id: "010505", name: "Conila" },
          { id: "010506", name: "Inguilpata" },
          { id: "010507", name: "Longuita" },
          { id: "010508", name: "Lonya Chico" },
          { id: "010509", name: "Luya" },
          { id: "010510", name: "Luya Viejo" },
          { id: "010511", name: "María" },
          { id: "010512", name: "Ocalli" },
          { id: "010513", name: "Ocumal" },
          { id: "010514", name: "Pisuquía" },
          { id: "010515", name: "Providencia" },
          { id: "010516", name: "San Cristóbal" },
          { id: "010517", name: "San Francisco del Yeso" },
          { id: "010518", name: "San Jerónimo" },
          { id: "010519", name: "San Juan de Lopecancha" },
          { id: "010520", name: "Santa Catalina" },
          { id: "010521", name: "Santo Tomás" },
          { id: "010522", name: "Tingo" },
          { id: "010523", name: "Trita" }
        ]
      },
      {
        id: "0106",
        name: "Rodríguez de Mendoza",
        code: "ROD",
        distritos: [
          { id: "010601", name: "Mendoza" },
          { id: "010602", name: "Chirimoto" },
          { id: "010603", name: "Cochamal" },
          { id: "010604", name: "Huambo" },
          { id: "010605", name: "Limabamba" },
          { id: "010606", name: "Longar" },
          { id: "010607", name: "Mariscal Benavides" },
          { id: "010608", name: "Milpuc" },
          { id: "010609", name: "Omia" },
          { id: "010610", name: "Santa Rosa" },
          { id: "010611", name: "Totora" },
          { id: "010612", name: "Vista Alegre" }
        ]
      },
      {
        id: "0107",
        name: "Utcubamba",
        code: "UTC",
        distritos: [
          { id: "010701", name: "Bagua Grande" },
          { id: "010702", name: "Cajaruro" },
          { id: "010703", name: "Cumba" },
          { id: "010704", name: "El Milagro" },
          { id: "010705", name: "Jamalca" },
          { id: "010706", name: "Lonya Grande" },
          { id: "010707", name: "Yamon" }
        ]
      }
    ]
  },
  {
    id: "02",
    name: "Áncash",
    code: "ANC",
    provincias: [
      {
        id: "0201",
        name: "Huaraz",
        code: "HUZ",
        distritos: [
          { id: "020101", name: "Huaraz" },
          { id: "020102", name: "Cochabamba" },
          { id: "020103", name: "Colcabamba" },
          { id: "020104", name: "Huanchay" },
          { id: "020105", name: "Independencia" },
          { id: "020106", name: "Jangas" },
          { id: "020107", name: "La Libertad" },
          { id: "020108", name: "Olleros" },
          { id: "020109", name: "Pampas" },
          { id: "020110", name: "Pariacoto" },
          { id: "020111", name: "Pira" },
          { id: "020112", name: "Tarica" }
        ]
      },
      {
        id: "0202",
        name: "Aija",
        code: "AIJ",
        distritos: [
          { id: "020201", name: "Aija" },
          { id: "020202", name: "Coris" },
          { id: "020203", name: "Huacllán" },
          { id: "020204", name: "La Merced" },
          { id: "020205", name: "Succha" }
        ]
      },
      {
        id: "0203",
        name: "Antonio Raymondi",
        code: "ANT",
        distritos: [
          { id: "020301", name: "Llamellín" },
          { id: "020302", name: "Aczo" },
          { id: "020303", name: "Chaccho" },
          { id: "020304", name: "Chingas" },
          { id: "020305", name: "Mirgas" },
          { id: "020306", name: "San Juan de Rontoy" }
        ]
      },
      {
        id: "0204",
        name: "Asunción",
        code: "ASU",
        distritos: [
          { id: "020401", name: "Chacas" },
          { id: "020402", name: "Acochaca" },
          { id: "020403", name: "Yungay" }
        ]
      },
      {
        id: "0205",
        name: "Bolognesi",
        code: "BOL",
        distritos: [
          { id: "020501", name: "Chiquián" },
          { id: "020502", name: "Abelardo Pardo Lezameta" },
          { id: "020503", name: "Antonio Raymondi" },
          { id: "020504", name: "Aquia" },
          { id: "020505", name: "Cajacay" },
          { id: "020506", name: "Canis" },
          { id: "020507", name: "Colquioc" },
          { id: "020508", name: "Huallanca" },
          { id: "020509", name: "Huasta" },
          { id: "020510", name: "Huayllacayán" },
          { id: "020511", name: "La Primavera" },
          { id: "020512", name: "Mangas" },
          { id: "020513", name: "Pacllón" },
          { id: "020514", name: "San Miguel de Corpanqui" },
          { id: "020515", name: "Ticllos" }
        ]
      },
      {
        id: "0206",
        name: "Carhuaz",
        code: "CAR",
        distritos: [
          { id: "020601", name: "Carhuaz" },
          { id: "020602", name: "Acopampa" },
          { id: "020603", name: "Amashca" },
          { id: "020604", name: "Anta" },
          { id: "020605", name: "Ataquero" },
          { id: "020606", name: "Marcará" },
          { id: "020607", name: "Pariahuanca" },
          { id: "020608", name: "San Miguel de Aco" },
          { id: "020609", name: "Shilla" },
          { id: "020610", name: "Tinco" },
          { id: "020611", name: "Yungar" }
        ]
      },
      {
        id: "0207",
        name: "Carlos Fermín Fitzcarrald",
        code: "CAF",
        distritos: [
          { id: "020701", name: "San Luis" },
          { id: "020702", name: "San Nicolás" },
          { id: "020703", name: "Yauya" }
        ]
      },
      {
        id: "0208",
        name: "Casma",
        code: "CAS",
        distritos: [
          { id: "020801", name: "Casma" },
          { id: "020802", name: "Buena Vista Alta" },
          { id: "020803", name: "Comandante Noel" },
          { id: "020804", name: "Yautan" }
        ]
      },
      {
        id: "0209",
        name: "Corongo",
        code: "COR",
        distritos: [
          { id: "020901", name: "Corongo" },
          { id: "020902", name: "Aco" },
          { id: "020903", name: "Bambas" },
          { id: "020904", name: "Cusca" },
          { id: "020905", name: "La Pampa" },
          { id: "020906", name: "Yanac" },
          { id: "020907", name: "Yupán" }
        ]
      },
      {
        id: "0210",
        name: "Huari",
        code: "HUR",
        distritos: [
          { id: "021001", name: "Huari" },
          { id: "021002", name: "Anra" },
          { id: "021003", name: "Cajay" },
          { id: "021004", name: "Chavín de Huántar" },
          { id: "021005", name: "Huacachi" },
          { id: "021006", name: "Huacchis" },
          { id: "021007", name: "Huachis" },
          { id: "021008", name: "Huantar" },
          { id: "021009", name: "Masin" },
          { id: "021010", name: "Paucas" },
          { id: "021011", name: "Ponto" },
          { id: "021012", name: "Rahuapampa" },
          { id: "021013", name: "Rapayán" },
          { id: "021014", name: "San Marcos" },
          { id: "021015", name: "San Pedro de Chana" },
          { id: "021016", name: "Uco" }
        ]
      },
      {
        id: "0211",
        name: "Huarmey",
        code: "HUM",
        distritos: [
          { id: "021101", name: "Huarmey" },
          { id: "021102", name: "Cochapeti" },
          { id: "021103", name: "Culebras" },
          { id: "021104", name: "Huayan" },
          { id: "021105", name: "Malvas" }
        ]
      },
      {
        id: "0212",
        name: "Huaylas",
        code: "HUA",
        distritos: [
          { id: "021201", name: "Caraz" },
          { id: "021202", name: "Huallanca" },
          { id: "021203", name: "Huata" },
          { id: "021204", name: "Huaylas" },
          { id: "021205", name: "Mato" },
          { id: "021206", name: "Pamparomás" },
          { id: "021207", name: "Pueblo Libre" },
          { id: "021208", name: "Santa Cruz" },
          { id: "021209", name: "Santo Toribio" },
          { id: "021210", name: "Yuracmarca" }
        ]
      },
      {
        id: "0213",
        name: "Mariscal Luzuriaga",
        code: "MAR",
        distritos: [
          { id: "021301", name: "Piscobamba" },
          { id: "021302", name: "Casca" },
          { id: "021303", name: "Eleazar Guzmán Barrón" },
          { id: "021304", name: "Fidel Olivas Escudero" },
          { id: "021305", name: "Llama" },
          { id: "021306", name: "Llumpa" },
          { id: "021307", name: "Lucma" },
          { id: "021308", name: "Musga" }
        ]
      },
      {
        id: "0214",
        name: "Ocros",
        code: "OCR",
        distritos: [
          { id: "021401", name: "Ocros" },
          { id: "021402", name: "Acas" },
          { id: "021403", name: "Cajamarquilla" },
          { id: "021404", name: "Carhuapampa" },
          { id: "021405", name: "Cochas" },
          { id: "021406", name: "Congas" },
          { id: "021407", name: "Llipa" },
          { id: "021408", name: "San Cristóbal de Rajan" },
          { id: "021409", name: "San Pedro" },
          { id: "021410", name: "Santiago de Chilcas" }
        ]
      },
      {
        id: "0215",
        name: "Pallasca",
        code: "PAL",
        distritos: [
          { id: "021501", name: "Cabana" },
          { id: "021502", name: "Bolognesi" },
          { id: "021503", name: "Conchucos" },
          { id: "021504", name: "Huacaschuque" },
          { id: "021505", name: "Huandoval" },
          { id: "021506", name: "Lacabamba" },
          { id: "021507", name: "Llapo" },
          { id: "021508", name: "Pallasca" },
          { id: "021509", name: "Pampas" },
          { id: "021510", name: "Santa Rosa" }
        ]
      },
      {
        id: "0216",
        name: "Pomabamba",
        code: "POM",
        distritos: [
          { id: "021601", name: "Pomabamba" },
          { id: "021602", name: "Huayllán" },
          { id: "021603", name: "Parobamba" },
          { id: "021604", name: "Quinuabamba" }
        ]
      },
      {
        id: "0217",
        name: "Recuay",
        code: "REC",
        distritos: [
          { id: "021701", name: "Recuay" },
          { id: "021702", name: "Catac" },
          { id: "021703", name: "Cotaparaco" },
          { id: "021704", name: "Huayllapampa" },
          { id: "021705", name: "Llacllín" },
          { id: "021706", name: "Marca" },
          { id: "021707", name: "Pampas Chico" },
          { id: "021708", name: "Pararín" },
          { id: "021709", name: "Tapacocha" },
          { id: "021710", name: "Ticapampa" }
        ]
      },
      {
        id: "0218",
        name: "Santa",
        code: "SAN",
        distritos: [
          { id: "021801", name: "Chimbote" },
          { id: "021802", name: "Cáceres del Perú" },
          { id: "021803", name: "Coishco" },
          { id: "021804", name: "Macate" },
          { id: "021805", name: "Moro" },
          { id: "021806", name: "Nepeña" },
          { id: "021807", name: "Samanco" },
          { id: "021808", name: "Santa" },
          { id: "021809", name: "Nuevo Chimbote" }
        ]
      },
      {
        id: "0219",
        name: "Sihuas",
        code: "SIH",
        distritos: [
          { id: "021901", name: "Sihuas" },
          { id: "021902", name: "Acobamba" },
          { id: "021903", name: "Alfonso Ugarte" },
          { id: "021904", name: "Cashapampa" },
          { id: "021905", name: "Chingalpo" },
          { id: "021906", name: "Huayllabamba" },
          { id: "021907", name: "Quiches" },
          { id: "021908", name: "Ragash" },
          { id: "021909", name: "San Juan" },
          { id: "021910", name: "Sicsibamba" }
        ]
      },
      {
        id: "0220",
        name: "Yungay",
        code: "YUN",
        distritos: [
          { id: "022001", name: "Yungay" },
          { id: "022002", name: "Cascapara" },
          { id: "022003", name: "Mancos" },
          { id: "022004", name: "Matacoto" },
          { id: "022005", name: "Quillo" },
          { id: "022006", name: "Ranrahirca" },
          { id: "022007", name: "Shupluy" },
          { id: "022008", name: "Yanama" }
        ]
      }
    ]
  },
  {
    id: "03",
    name: "Apurímac",
    code: "APU",
    provincias: [
      {
        id: "0301",
        name: "Abancay",
        code: "ABA",
        distritos: [
          { id: "030101", name: "Abancay" },
          { id: "030102", name: "Chacoche" },
          { id: "030103", name: "Circa" },
          { id: "030104", name: "Curahuasi" },
          { id: "030105", name: "Huanipaca" },
          { id: "030106", name: "Lambrama" },
          { id: "030107", name: "Pichirhua" },
          { id: "030108", name: "San Pedro de Cachora" },
          { id: "030109", name: "Tamburco" }
        ]
      },
      {
        id: "0302",
        name: "Andahuaylas",
        code: "AND",
        distritos: [
          { id: "030201", name: "Andahuaylas" },
          { id: "030202", name: "Andarapa" },
          { id: "030203", name: "Chiara" },
          { id: "030204", name: "Huancaray" },
          { id: "030205", name: "Huancarama" },
          { id: "030206", name: "Kishuara" },
          { id: "030207", name: "Pacobamba" },
          { id: "030208", name: "Pacucha" },
          { id: "030209", name: "Pampachiri" },
          { id: "030210", name: "Pomacocha" },
          { id: "030211", name: "San Antonio de Cachi" },
          { id: "030212", name: "San Jerónimo" },
          { id: "030213", name: "San Miguel de Chaccrampa" },
          { id: "030214", name: "Santa María de Chicmo" },
          { id: "030215", name: "Talavera" },
          { id: "030216", name: "Tumay Huaraca" },
          { id: "030217", name: "Turpo" },
          { id: "030218", name: "Kaquiabamba" },
          { id: "030219", name: "José María Arguedas" }
        ]
      },
      {
        id: "0303",
        name: "Antabamba",
        code: "ANT",
        distritos: [
          { id: "030301", name: "Antabamba" },
          { id: "030302", name: "El Oro" },
          { id: "030303", name: "Huaquirca" },
          { id: "030304", name: "Juan Espinoza Medrano" },
          { id: "030305", name: "Oropesa" },
          { id: "030306", name: "Pachaconas" },
          { id: "030307", name: "Sabaino" }
        ]
      },
      {
        id: "0304",
        name: "Aymaraes",
        code: "AYM",
        distritos: [
          { id: "030401", name: "Chalhuanca" },
          { id: "030402", name: "Capaya" },
          { id: "030403", name: "Caraybamba" },
          { id: "030404", name: "Chapimarca" },
          { id: "030405", name: "Colcabamba" },
          { id: "030406", name: "Cotaruse" },
          { id: "030407", name: "Huayllo" },
          { id: "030408", name: "Justo Apu Sahuaraura" },
          { id: "030409", name: "Lucre" },
          { id: "030410", name: "Pocohuanca" },
          { id: "030411", name: "San Juan de Chacña" },
          { id: "030412", name: "Sañayca" },
          { id: "030413", name: "Soraya" },
          { id: "030414", name: "Tapairihua" },
          { id: "030415", name: "Tintay" },
          { id: "030416", name: "Toraya" },
          { id: "030417", name: "Yanaca" }
        ]
      },
      {
        id: "0305",
        name: "Cotabambas",
        code: "COT",
        distritos: [
          { id: "030501", name: "Tambobamba" },
          { id: "030502", name: "Cotabambas" },
          { id: "030503", name: "Coyllurqui" },
          { id: "030504", name: "Haquira" },
          { id: "030505", name: "Mara" },
          { id: "030506", name: "Challhuahuacho" }
        ]
      },
      {
        id: "0306",
        name: "Chincheros",
        code: "CHI",
        distritos: [
          { id: "030601", name: "Chincheros" },
          { id: "030602", name: "Anco_Huallo" },
          { id: "030603", name: "Cocharcas" },
          { id: "030604", name: "Huaccana" },
          { id: "030605", name: "Ocobamba" },
          { id: "030606", name: "Ongoy" },
          { id: "030607", name: "Uranmarca" },
          { id: "030608", name: "Ranracancha" }
        ]
      },
      {
        id: "0307",
        name: "Grau",
        code: "GRA",
        distritos: [
          { id: "030701", name: "Chuquibambilla" },
          { id: "030702", name: "Curpahuasi" },
          { id: "030703", name: "Gamara" },
          { id: "030704", name: "Huayllati" },
          { id: "030705", name: "Mamara" },
          { id: "030706", name: "Micaela Bastidas" },
          { id: "030707", name: "Pataypampa" },
          { id: "030708", name: "Progreso" },
          { id: "030709", name: "San Antonio" },
          { id: "030710", name: "Santa Rosa" },
          { id: "030711", name: "Turpay" },
          { id: "030712", name: "Vilcabamba" },
          { id: "030713", name: "Virundo" },
          { id: "030714", name: "Curasco" }
        ]
      }
    ]
  },
  {
    id: "04",
    name: "Arequipa",
    code: "ARE",
    provincias: [
      {
        id: "0401",
        name: "Arequipa",
        code: "AQP",
        distritos: [
          { id: "040101", name: "Arequipa" },
          { id: "040102", name: "Alto Selva Alegre" },
          { id: "040103", name: "Cayma" },
          { id: "040104", name: "Cerro Colorado" },
          { id: "040105", name: "Characato" },
          { id: "040106", name: "Chiguata" },
          { id: "040107", name: "Jacobo Hunter" },
          { id: "040108", name: "La Joya" },
          { id: "040109", name: "Mariano Melgar" },
          { id: "040110", name: "Miraflores" },
          { id: "040111", name: "Mollebaya" },
          { id: "040112", name: "Paucarpata" },
          { id: "040113", name: "Pocsi" },
          { id: "040114", name: "Polobaya" },
          { id: "040115", name: "Quequeña" },
          { id: "040116", name: "Sabandía" },
          { id: "040117", name: "Sachaca" },
          { id: "040118", name: "San Juan de Siguas" },
          { id: "040119", name: "San Juan de Tarucani" },
          { id: "040120", name: "Santa Isabel de Siguas" },
          { id: "040121", name: "Santa Rita de Siguas" },
          { id: "040122", name: "Socabaya" },
          { id: "040123", name: "Tiabaya" },
          { id: "040124", name: "Uchumayo" },
          { id: "040125", name: "Vitor" },
          { id: "040126", name: "Yanahuara" },
          { id: "040127", name: "Yarabamba" },
          { id: "040128", name: "Yura" },
          { id: "040129", name: "José Luis Bustamante y Rivero" }
        ]
      },
      {
        id: "0402",
        name: "Camaná",
        code: "CAM",
        distritos: [
          { id: "040201", name: "Camaná" },
          { id: "040202", name: "José María Quimper" },
          { id: "040203", name: "Mariano Nicolás Valcárcel" },
          { id: "040204", name: "Mariscal Cáceres" },
          { id: "040205", name: "Nicolás de Pierola" },
          { id: "040206", name: "Ocoña" },
          { id: "040207", name: "Quilca" },
          { id: "040208", name: "Samuel Pastor" }
        ]
      },
      {
        id: "0403",
        name: "Caravelí",
        code: "CAV",
        distritos: [
          { id: "040301", name: "Caravelí" },
          { id: "040302", name: "Acarí" },
          { id: "040303", name: "Atico" },
          { id: "040304", name: "Atiquipa" },
          { id: "040305", name: "Bella Unión" },
          { id: "040306", name: "Cahuacho" },
          { id: "040307", name: "Chala" },
          { id: "040308", name: "Chaparra" },
          { id: "040309", name: "Huanuhuanu" },
          { id: "040310", name: "Jaqui" },
          { id: "040311", name: "Lomas" },
          { id: "040312", name: "Quicacha" },
          { id: "040313", name: "Yauca" }
        ]
      },
      {
        id: "0404",
        name: "Castilla",
        code: "CAS",
        distritos: [
          { id: "040401", name: "Aplao" },
          { id: "040402", name: "Andagua" },
          { id: "040403", name: "Ayo" },
          { id: "040404", name: "Chachas" },
          { id: "040405", name: "Chilcaymarca" },
          { id: "040406", name: "Choco" },
          { id: "040407", name: "Huancarqui" },
          { id: "040408", name: "Machaguay" },
          { id: "040409", name: "Orcopampa" },
          { id: "040410", name: "Pampacolca" },
          { id: "040411", name: "Tipan" },
          { id: "040412", name: "Uñon" },
          { id: "040413", name: "Uraca" },
          { id: "040414", name: "Viraco" }
        ]
      },
      {
        id: "0405",
        name: "Caylloma",
        code: "CAY",
        distritos: [
          { id: "040501", name: "Chivay" },
          { id: "040502", name: "Achoma" },
          { id: "040503", name: "Cabanaconde" },
          { id: "040504", name: "Callalli" },
          { id: "040505", name: "Caylloma" },
          { id: "040506", name: "Coporaque" },
          { id: "040507", name: "Huambo" },
          { id: "040508", name: "Huanca" },
          { id: "040509", name: "Ichupampa" },
          { id: "040510", name: "Lari" },
          { id: "040511", name: "Lluta" },
          { id: "040512", name: "Maca" },
          { id: "040513", name: "Madrigal" },
          { id: "040514", name: "San Antonio de Chuca" },
          { id: "040515", name: "Sibayo" },
          { id: "040516", name: "Tapay" },
          { id: "040517", name: "Tisco" },
          { id: "040518", name: "Tuti" },
          { id: "040519", name: "Yanque" }
        ]
      },
      {
        id: "0406",
        name: "Condesuyos",
        code: "CON",
        distritos: [
          { id: "040601", name: "Chuquibamba" },
          { id: "040602", name: "Andaray" },
          { id: "040603", name: "Cayarani" },
          { id: "040604", name: "Chichas" },
          { id: "040605", name: "Iray" },
          { id: "040606", name: "Río Grande" },
          { id: "040607", name: "Salamanca" },
          { id: "040608", name: "Yanaquihua" }
        ]
      },
      {
        id: "0407",
        name: "Islay",
        code: "ISL",
        distritos: [
          { id: "040701", name: "Mollendo" },
          { id: "040702", name: "Cocachacra" },
          { id: "040703", name: "Dean Valdivia" },
          { id: "040704", name: "Islay" },
          { id: "040705", name: "Mejía" },
          { id: "040706", name: "Punta de Bombón" }
        ]
      },
      {
        id: "0408",
        name: "La Unión",
        code: "LAU",
        distritos: [
          { id: "040801", name: "Cotahuasi" },
          { id: "040802", name: "Alca" },
          { id: "040803", name: "Charcana" },
          { id: "040804", name: "Huaynacotas" },
          { id: "040805", name: "Pampamarca" },
          { id: "040806", name: "Puyca" },
          { id: "040807", name: "Quechualla" },
          { id: "040808", name: "Sayla" },
          { id: "040809", name: "Tauria" },
          { id: "040810", name: "Tomepampa" },
          { id: "040811", name: "Toro" }
        ]
      }
    ]
  },
  {
    id: "05",
    name: "Ayacucho",
    code: "AYA",
    provincias: [
      {
        id: "0501",
        name: "Huamanga",
        code: "HUA",
        distritos: [
          { id: "050101", name: "Ayacucho" },
          { id: "050102", name: "Acocro" },
          { id: "050103", name: "Acos Vinchos" },
          { id: "050104", name: "Carmen Alto" },
          { id: "050105", name: "Chiara" },
          { id: "050106", name: "Ocros" },
          { id: "050107", name: "Pacaycasa" },
          { id: "050108", name: "Quinua" },
          { id: "050109", name: "San José de Ticllas" },
          { id: "050110", name: "San Juan Bautista" },
          { id: "050111", name: "Santiago de Pischa" },
          { id: "050112", name: "Socos" },
          { id: "050113", name: "Tambillo" },
          { id: "050114", name: "Vinchos" },
          { id: "050115", name: "Jesús Nazareno" },
          { id: "050116", name: "Andrés Avelino Cáceres Dorregaray" }
        ]
      },
      {
        id: "0502",
        name: "Cangallo",
        code: "CAN",
        distritos: [
          { id: "050201", name: "Cangallo" },
          { id: "050202", name: "Chuschi" },
          { id: "050203", name: "Los Morochucos" },
          { id: "050204", name: "María Parado de Bellido" },
          { id: "050205", name: "Paras" },
          { id: "050206", name: "Totos" }
        ]
      },
      {
        id: "0503",
        name: "Huanca Sancos",
        code: "HUS",
        distritos: [
          { id: "050301", name: "Huanca Sancos" },
          { id: "050302", name: "Carapo" },
          { id: "050303", name: "Sacsamarca" },
          { id: "050304", name: "Santiago de Lucanamarca" }
        ]
      },
      {
        id: "0504",
        name: "Huanta",
        code: "HUA",
        distritos: [
          { id: "050401", name: "Huanta" },
          { id: "050402", name: "Ayahuanco" },
          { id: "050403", name: "Huamanguilla" },
          { id: "050404", name: "Iguain" },
          { id: "050405", name: "Luricocha" },
          { id: "050406", name: "Santillana" },
          { id: "050407", name: "Sivia" },
          { id: "050408", name: "Llochegua" }
        ]
      },
      {
        id: "0505",
        name: "La Mar",
        code: "LAM",
        distritos: [
          { id: "050501", name: "San Miguel" },
          { id: "050502", name: "Anco" },
          { id: "050503", name: "Ayna" },
          { id: "050504", name: "Chilcas" },
          { id: "050505", name: "Chungui" },
          { id: "050506", name: "Luis Carranza" },
          { id: "050507", name: "Santa Rosa" },
          { id: "050508", name: "Tambo" },
          { id: "050509", name: "Samugari" },
          { id: "050510", name: "Anchihuay" }
        ]
      },
      {
        id: "0506",
        name: "Lucanas",
        code: "LUC",
        distritos: [
          { id: "050601", name: "Puquio" },
          { id: "050602", name: "Aucara" },
          { id: "050603", name: "Cabana" },
          { id: "050604", name: "Carmen Salcedo" },
          { id: "050605", name: "Chaviña" },
          { id: "050606", name: "Chipao" },
          { id: "050607", name: "Huac-Huas" },
          { id: "050608", name: "Laramate" },
          { id: "050609", name: "Leoncio Prado" },
          { id: "050610", name: "Llauta" },
          { id: "050611", name: "Lucanas" },
          { id: "050612", name: "Ocaña" },
          { id: "050613", name: "Otoca" },
          { id: "050614", name: "Saisa" },
          { id: "050615", name: "San Cristóbal" },
          { id: "050616", name: "San Juan" },
          { id: "050617", name: "San Pedro" },
          { id: "050618", name: "San Pedro de Palco" },
          { id: "050619", name: "Sancos" },
          { id: "050620", name: "Santa Ana de Huaycahuacho" },
          { id: "050621", name: "Santa Lucia" }
        ]
      },
      {
        id: "0507",
        name: "Parinacochas",
        code: "PAR",
        distritos: [
          { id: "050701", name: "Coracora" },
          { id: "050702", name: "Chumpi" },
          { id: "050703", name: "Coronel Castañeda" },
          { id: "050704", name: "Pacapausa" },
          { id: "050705", name: "Pullo" },
          { id: "050706", name: "Puyusca" },
          { id: "050707", name: "San Francisco de Ravacayco" },
          { id: "050708", name: "Upahuacho" }
        ]
      },
      {
        id: "0508",
        name: "Páucar del Sara Sara",
        code: "PAU",
        distritos: [
          { id: "050801", name: "Pausa" },
          { id: "050802", name: "Colta" },
          { id: "050803", name: "Corculla" },
          { id: "050804", name: "Lampa" },
          { id: "050805", name: "Marcabamba" },
          { id: "050806", name: "Oyolo" },
          { id: "050807", name: "Pararca" },
          { id: "050808", name: "San Javier de Alpabamba" },
          { id: "050809", name: "San José de Ushua" },
          { id: "050810", name: "Sara Sara" }
        ]
      },
      {
        id: "0509",
        name: "Sucre",
        code: "SUC",
        distritos: [
          { id: "050901", name: "Querobamba" },
          { id: "050902", name: "Belén" },
          { id: "050903", name: "Chalcos" },
          { id: "050904", name: "Chilcayoc" },
          { id: "050905", name: "Huacaña" },
          { id: "050906", name: "Morcolla" },
          { id: "050907", name: "Paico" },
          { id: "050908", name: "San Pedro de Larcay" },
          { id: "050909", name: "San Salvador de Quije" },
          { id: "050910", name: "Santiago de Paucaray" },
          { id: "050911", name: "Soras" }
        ]
      },
      {
        id: "0510",
        name: "Víctor Fajardo",
        code: "VIC",
        distritos: [
          { id: "051001", name: "Huancapi" },
          { id: "051002", name: "Alcamenca" },
          { id: "051003", name: "Apongo" },
          { id: "051004", name: "Asquipata" },
          { id: "051005", name: "Canaria" },
          { id: "051006", name: "Cayara" },
          { id: "051007", name: "Colca" },
          { id: "051008", name: "Huamanquiquia" },
          { id: "051009", name: "Huancaraylla" },
          { id: "051010", name: "Hualla" },
          { id: "051011", name: "Sarhua" },
          { id: "051012", name: "Vilcanchos" }
        ]
      },
      {
        id: "0511",
        name: "Vilcas Huamán",
        code: "VIL",
        distritos: [
          { id: "051101", name: "Vilcas Huaman" },
          { id: "051102", name: "Accomarca" },
          { id: "051103", name: "Carhuanca" },
          { id: "051104", name: "Concepción" },
          { id: "051105", name: "Huambalpa" },
          { id: "051106", name: "Independencia" },
          { id: "051107", name: "Saurama" },
          { id: "051108", name: "Vischongo" }
        ]
      }
    ]
  },
  {
    id: "06",
    name: "Cajamarca",
    code: "CAJ",
    provincias: [
      {
        id: "0601",
        name: "Cajamarca",
        code: "CAJ",
        distritos: [
          { id: "060101", name: "Cajamarca" },
          { id: "060102", name: "Asunción" },
          { id: "060103", name: "Chetilla" },
          { id: "060104", name: "Cospan" },
          { id: "060105", name: "Encañada" },
          { id: "060106", name: "Jesús" },
          { id: "060107", name: "Llacanora" },
          { id: "060108", name: "Los Baños del Inca" },
          { id: "060109", name: "Magdalena" },
          { id: "060110", name: "Matara" },
          { id: "060111", name: "Namora" },
          { id: "060112", name: "San Juan" }
        ]
      },
      {
        id: "0602",
        name: "Cajabamba",
        code: "CAB",
        distritos: [
          { id: "060201", name: "Cajabamba" },
          { id: "060202", name: "Cachachi" },
          { id: "060203", name: "Condebamba" },
          { id: "060204", name: "Sitacocha" }
        ]
      },
      {
        id: "0603",
        name: "Celendín",
        code: "CEL",
        distritos: [
          { id: "060301", name: "Celendín" },
          { id: "060302", name: "Chumuch" },
          { id: "060303", name: "Cortegana" },
          { id: "060304", name: "Huasmin" },
          { id: "060305", name: "Jorge Chávez" },
          { id: "060306", name: "José Gálvez" },
          { id: "060307", name: "Miguel Iglesias" },
          { id: "060308", name: "Oxamarca" },
          { id: "060309", name: "Sorochuco" },
          { id: "060310", name: "Sucre" },
          { id: "060311", name: "Utco" },
          { id: "060312", name: "La Libertad de Pallan" }
        ]
      },
      {
        id: "0604",
        name: "Chota",
        code: "CHO",
        distritos: [
          { id: "060401", name: "Chota" },
          { id: "060402", name: "Anguía" },
          { id: "060403", name: "Chadin" },
          { id: "060404", name: "Chiguirip" },
          { id: "060405", name: "Chimban" },
          { id: "060406", name: "Choropampa" },
          { id: "060407", name: "Cochabamba" },
          { id: "060408", name: "Conchan" },
          { id: "060409", name: "Huambos" },
          { id: "060410", name: "Lajas" },
          { id: "060411", name: "Llama" },
          { id: "060412", name: "Miracosta" },
          { id: "060413", name: "Paccha" },
          { id: "060414", name: "Pion" },
          { id: "060415", name: "Querocoto" },
          { id: "060416", name: "San Juan de Licupis" },
          { id: "060417", name: "Tacabamba" },
          { id: "060418", name: "Tocmoche" },
          { id: "060419", name: "Chalamarca" }
        ]
      },
      {
        id: "0605",
        name: "Contumazá",
        code: "CON",
        distritos: [
          { id: "060501", name: "Contumazá" },
          { id: "060502", name: "Chilete" },
          { id: "060503", name: "Cupisnique" },
          { id: "060504", name: "Guzmango" },
          { id: "060505", name: "San Benito" },
          { id: "060506", name: "Santa Cruz de Toledo" },
          { id: "060507", name: "Tantarica" },
          { id: "060508", name: "Yonán" }
        ]
      },
      {
        id: "0606",
        name: "Cutervo",
        code: "CUT",
        distritos: [
          { id: "060601", name: "Cutervo" },
          { id: "060602", name: "Callayuc" },
          { id: "060603", name: "Choros" },
          { id: "060604", name: "Cujillo" },
          { id: "060605", name: "La Ramada" },
          { id: "060606", name: "Pimpingos" },
          { id: "060607", name: "Querocotillo" },
          { id: "060608", name: "San Andrés de Cutervo" },
          { id: "060609", name: "San Juan de Cutervo" },
          { id: "060610", name: "San Luis de Lucma" },
          { id: "060611", name: "Santa Cruz" },
          { id: "060612", name: "Santo Domingo de la Capilla" },
          { id: "060613", name: "Santo Tomás" },
          { id: "060614", name: "Socota" },
          { id: "060615", name: "Toribio Casanova" }
        ]
      },
      {
        id: "0607",
        name: "Hualgayoc",
        code: "HUA",
        distritos: [
          { id: "060701", name: "Bambamarca" },
          { id: "060702", name: "Chugur" },
          { id: "060703", name: "Hualgayoc" }
        ]
      },
      {
        id: "0608",
        name: "Jaén",
        code: "JAE",
        distritos: [
          { id: "060801", name: "Jaén" },
          { id: "060802", name: "Bellavista" },
          { id: "060803", name: "Chontali" },
          { id: "060804", name: "Colasay" },
          { id: "060805", name: "Huabal" },
          { id: "060806", name: "Las Pirias" },
          { id: "060807", name: "Pomahuaca" },
          { id: "060808", name: "Pucara" },
          { id: "060809", name: "Sallique" },
          { id: "060810", name: "San Felipe" },
          { id: "060811", name: "San José del Alto" },
          { id: "060812", name: "Santa Rosa" }
        ]
      },
      {
        id: "0609",
        name: "San Ignacio",
        code: "SAI",
        distritos: [
          { id: "060901", name: "San Ignacio" },
          { id: "060902", name: "Chirinos" },
          { id: "060903", name: "Huarango" },
          { id: "060904", name: "La Coipa" },
          { id: "060905", name: "Namballe" },
          { id: "060906", name: "San José de Lourdes" },
          { id: "060907", name: "Tabaconas" }
        ]
      },
      {
        id: "0610",
        name: "San Marcos",
        code: "SAM",
        distritos: [
          { id: "061001", name: "Pedro Gálvez" },
          { id: "061002", name: "Chancay" },
          { id: "061003", name: "Eduardo Villanueva" },
          { id: "061004", name: "Gregorio Pita" },
          { id: "061005", name: "Ichocan" },
          { id: "061006", name: "José Manuel Quiroz" },
          { id: "061007", name: "José Sabogal" }
        ]
      },
      {
        id: "0611",
        name: "San Miguel",
        code: "SAM",
        distritos: [
          { id: "061101", name: "San Miguel" },
          { id: "061102", name: "Bolívar" },
          { id: "061103", name: "Calquis" },
          { id: "061104", name: "Catilluc" },
          { id: "061105", name: "El Prado" },
          { id: "061106", name: "La Florida" },
          { id: "061107", name: "Llapa" },
          { id: "061108", name: "Nanchoc" },
          { id: "061109", name: "Niepos" },
          { id: "061110", name: "San Gregorio" },
          { id: "061111", name: "San Silvestre de Cochan" },
          { id: "061112", name: "Tongod" },
          { id: "061113", name: "Unión Agua Blanca" }
        ]
      },
      {
        id: "0612",
        name: "San Pablo",
        code: "SAP",
        distritos: [
          { id: "061201", name: "San Pablo" },
          { id: "061202", name: "San Bernardino" },
          { id: "061203", name: "San Luis" },
          { id: "061204", name: "Tumbaden" }
        ]
      },
      {
        id: "0613",
        name: "Santa Cruz",
        code: "SAC",
        distritos: [
          { id: "061301", name: "Santa Cruz" },
          { id: "061302", name: "Andabamba" },
          { id: "061303", name: "Catache" },
          { id: "061304", name: "Chancaybaños" },
          { id: "061305", name: "La Esperanza" },
          { id: "061306", name: "Ninabamba" },
          { id: "061307", name: "Pulan" },
          { id: "061308", name: "Saucepampa" },
          { id: "061309", name: "Sexi" },
          { id: "061310", name: "Uticyacu" },
          { id: "061311", name: "Yauyucan" }
        ]
      }
    ]
  },
  {
    id: "07",
    name: "Callao",
    code: "CAL",
    provincias: [
      {
        id: "0701",
        name: "Callao",
        code: "CAL",
        distritos: [
          { id: "070101", name: "Callao" },
          { id: "070102", name: "Bellavista" },
          { id: "070103", name: "Carmen de la Legua Reynoso" },
          { id: "070104", name: "La Perla" },
          { id: "070105", name: "La Punta" },
          { id: "070106", name: "Ventanilla" },
          { id: "070107", name: "Mi Perú" }
        ]
      }
    ]
  },
  {
    id: "08",
    name: "Cusco",
    code: "CUS",
    provincias: [
      {
        id: "0801",
        name: "Cusco",
        code: "CUS",
        distritos: [
          { id: "080101", name: "Cusco" },
          { id: "080102", name: "Ccorca" },
          { id: "080103", name: "Poroy" },
          { id: "080104", name: "San Jerónimo" },
          { id: "080105", name: "San Sebastián" },
          { id: "080106", name: "Santiago" },
          { id: "080107", name: "Saylla" },
          { id: "080108", name: "Wanchaq" }
        ]
      }
    ]
  },
  {
    id: "09",
    name: "Huancavelica",
    code: "HUV",
    provincias: [
      {
        id: "0901",
        name: "Huancavelica",
        code: "HUV",
        distritos: [
          { id: "090101", name: "Huancavelica" },
          { id: "090102", name: "Acobambilla" },
          { id: "090103", name: "Acoria" },
          { id: "090104", name: "Conayca" },
          { id: "090105", name: "Cuenca" },
          { id: "090106", name: "Huachocolpa" },
          { id: "090107", name: "Huayllahuara" },
          { id: "090108", name: "Izcuchaca" },
          { id: "090109", name: "Laria" },
          { id: "090110", name: "Manta" },
          { id: "090111", name: "Mariscal Cáceres" },
          { id: "090112", name: "Moya" },
          { id: "090113", name: "Nuevo Occoro" },
          { id: "090114", name: "Palca" },
          { id: "090115", name: "Pilchaca" },
          { id: "090116", name: "Vilca" },
          { id: "090117", name: "Yauli" },
          { id: "090118", name: "Ascensión" },
          { id: "090119", name: "Huando" }
        ]
      }
    ]
  },
  {
    id: "10",
    name: "Huánuco",
    code: "HUC",
    provincias: [
      {
        id: "1001",
        name: "Huánuco",
        code: "HUC",
        distritos: [
          { id: "100101", name: "Huánuco" },
          { id: "100102", name: "Amarilis" },
          { id: "100103", name: "Chinchao" },
          { id: "100104", name: "Churubamba" },
          { id: "100105", name: "Margos" },
          { id: "100106", name: "Quisqui" },
          { id: "100107", name: "San Francisco de Cayran" },
          { id: "100108", name: "San Pedro de Chaulán" },
          { id: "100109", name: "Santa María del Valle" },
          { id: "100110", name: "Yarumayo" },
          { id: "100111", name: "Pillco Marca" },
          { id: "100112", name: "Yacus" }
        ]
      }
    ]
  },
  {
    id: "11",
    name: "Ica",
    code: "ICA",
    provincias: [
      {
        id: "1101",
        name: "Ica",
        code: "ICA",
        distritos: [
          { id: "110101", name: "Ica" },
          { id: "110102", name: "La Tinguiña" },
          { id: "110103", name: "Los Aquijes" },
          { id: "110104", name: "Ocucaje" },
          { id: "110105", name: "Pachacutec" },
          { id: "110106", name: "Parcona" },
          { id: "110107", name: "Pueblo Nuevo" },
          { id: "110108", name: "Salas" },
          { id: "110109", name: "San José de Los Molinos" },
          { id: "110110", name: "San Juan Bautista" },
          { id: "110111", name: "Santiago" },
          { id: "110112", name: "Subtanjalla" },
          { id: "110113", name: "Tate" },
          { id: "110114", name: "Yauca del Rosario" }
        ]
      }
    ]
  },
  {
    id: "12",
    name: "Junín",
    code: "JUN",
    provincias: [
      {
        id: "1201",
        name: "Huancayo",
        code: "HUJ",
        distritos: [
          { id: "120101", name: "Huancayo" },
          { id: "120102", name: "Carhuacallanga" },
          { id: "120103", name: "Chacapampa" },
          { id: "120104", name: "Chicche" },
          { id: "120105", name: "Chilca" },
          { id: "120106", name: "Chongos Alto" },
          { id: "120107", name: "Chupuro" },
          { id: "120108", name: "Colca" },
          { id: "120109", name: "Cullhuas" },
          { id: "120110", name: "El Tambo" },
          { id: "120111", name: "Huacrapuquio" },
          { id: "120112", name: "Hualhuas" },
          { id: "120113", name: "Huancan" },
          { id: "120114", name: "Huasicancha" },
          { id: "120115", name: "Huayucachi" },
          { id: "120116", name: "Ingenio" },
          { id: "120117", name: "Pariahuanca" },
          { id: "120118", name: "Pilcomayo" },
          { id: "120119", name: "Pucará" },
          { id: "120120", name: "Quichuay" },
          { id: "120121", name: "Quilcas" },
          { id: "120122", name: "San Agustín" },
          { id: "120123", name: "San Jerónimo de Tunan" },
          { id: "120124", name: "Santo Domingo de Acobamba" },
          { id: "120125", name: "Sapallanga" },
          { id: "120126", name: "Saño" },
          { id: "120127", name: "Sicaya" },
          { id: "120128", name: "Viques" }
        ]
      }
    ]
  },
  {
    id: "13",
    name: "La Libertad",
    code: "LAL",
    provincias: [
      {
        id: "1301",
        name: "Trujillo",
        code: "TRU",
        distritos: [
          { id: "130101", name: "Trujillo" },
          { id: "130102", name: "El Porvenir" },
          { id: "130103", name: "Florencia de Mora" },
          { id: "130104", name: "Huanchaco" },
          { id: "130105", name: "La Esperanza" },
          { id: "130106", name: "Laredo" },
          { id: "130107", name: "Moche" },
          { id: "130108", name: "Poroto" },
          { id: "130109", name: "Salaverry" },
          { id: "130110", name: "Simbal" },
          { id: "130111", name: "Victor Larco Herrera" }
        ]
      }
    ]
  },
  {
    id: "14",
    name: "Lambayeque",
    code: "LAM",
    provincias: [
      {
        id: "1401",
        name: "Chiclayo",
        code: "CHI",
        distritos: [
          { id: "140101", name: "Chiclayo" },
          { id: "140102", name: "Cayalti" },
          { id: "140103", name: "Chongoyape" },
          { id: "140104", name: "Eten" },
          { id: "140105", name: "Eten Puerto" },
          { id: "140106", name: "José Leonardo Ortiz" },
          { id: "140107", name: "La Victoria" },
          { id: "140108", name: "Lagunas" },
          { id: "140109", name: "Monsefú" },
          { id: "140110", name: "Nueva Arica" },
          { id: "140111", name: "Oyotún" },
          { id: "140112", name: "Picsi" },
          { id: "140113", name: "Pimentel" },
          { id: "140114", name: "Pomalca" },
          { id: "140115", name: "Pucalá" },
          { id: "140116", name: "Reque" },
          { id: "140117", name: "Santa Rosa" },
          { id: "140118", name: "Saña" },
          { id: "140119", name: "Tumán" },
          { id: "140120", name: "Zaña" }
        ]
      }
    ]
  },
  {
    id: "15",
    name: "Lima",
    code: "LIM",
    provincias: [
      {
        id: "1501",
        name: "Lima",
        code: "LIM",
        distritos: [
          { id: "150101", name: "Lima" },
          { id: "150102", name: "Ancón" },
          { id: "150103", name: "Ate" },
          { id: "150104", name: "Barranco" },
          { id: "150105", name: "Breña" },
          { id: "150106", name: "Carabayllo" },
          { id: "150107", name: "Chaclacayo" },
          { id: "150108", name: "Chorrillos" },
          { id: "150109", name: "Cieneguilla" },
          { id: "150110", name: "Comas" },
          { id: "150111", name: "El Agustino" },
          { id: "150112", name: "Independencia" },
          { id: "150113", name: "Jesús María" },
          { id: "150114", name: "La Molina" },
          { id: "150115", name: "La Victoria" },
          { id: "150116", name: "Lince" },
          { id: "150117", name: "Los Olivos" },
          { id: "150118", name: "Lurigancho" },
          { id: "150119", name: "Lurín" },
          { id: "150120", name: "Magdalena del Mar" },
          { id: "150121", name: "Miraflores" },
          { id: "150122", name: "Pachacámac" },
          { id: "150123", name: "Pucusana" },
          { id: "150124", name: "Pueblo Libre" },
          { id: "150125", name: "Puente Piedra" },
          { id: "150126", name: "Punta Hermosa" },
          { id: "150127", name: "Punta Negra" },
          { id: "150128", name: "Rímac" },
          { id: "150129", name: "San Bartolo" },
          { id: "150130", name: "San Borja" },
          { id: "150131", name: "San Isidro" },
          { id: "150132", name: "San Juan de Lurigancho" },
          { id: "150133", name: "San Juan de Miraflores" },
          { id: "150134", name: "San Luis" },
          { id: "150135", name: "San Martín de Porres" },
          { id: "150136", name: "San Miguel" },
          { id: "150137", name: "Santa Anita" },
          { id: "150138", name: "Santa María del Mar" },
          { id: "150139", name: "Santa Rosa" },
          { id: "150140", name: "Santiago de Surco" },
          { id: "150141", name: "Surquillo" },
          { id: "150142", name: "Villa El Salvador" },
          { id: "150143", name: "Villa María del Triunfo" }
        ]
      }
    ]
  },
  {
    id: "16",
    name: "Loreto",
    code: "LOR",
    provincias: [
      {
        id: "1601",
        name: "Maynas",
        code: "MAY",
        distritos: [
          { id: "160101", name: "Iquitos" },
          { id: "160102", name: "Alto Nanay" },
          { id: "160103", name: "Fernando Lores" },
          { id: "160104", name: "Indiana" },
          { id: "160105", name: "Las Amazonas" },
          { id: "160106", name: "Mazán" },
          { id: "160107", name: "Napo" },
          { id: "160108", name: "Punchana" },
          { id: "160109", name: "Putumayo" },
          { id: "160110", name: "Torres Causana" },
          { id: "160112", name: "Belén" },
          { id: "160113", name: "San Juan Bautista" }
        ]
      }
    ]
  },
  {
    id: "17",
    name: "Madre de Dios",
    code: "MDD",
    provincias: [
      {
        id: "1701",
        name: "Tambopata",
        code: "TAM",
        distritos: [
          { id: "170101", name: "Tambopata" },
          { id: "170102", name: "Inambari" },
          { id: "170103", name: "Las Piedras" },
          { id: "170104", name: "Laberinto" }
        ]
      }
    ]
  },
  {
    id: "18",
    name: "Moquegua",
    code: "MOQ",
    provincias: [
      {
        id: "1801",
        name: "Mariscal Nieto",
        code: "MAR",
        distritos: [
          { id: "180101", name: "Moquegua" },
          { id: "180102", name: "Carumas" },
          { id: "180103", name: "Cuchumbaya" },
          { id: "180104", name: "Samegua" },
          { id: "180105", name: "San Cristóbal" },
          { id: "180106", name: "Torata" }
        ]
      }
    ]
  },
  {
    id: "19",
    name: "Pasco",
    code: "PAS",
    provincias: [
      {
        id: "1901",
        name: "Pasco",
        code: "PAS",
        distritos: [
          { id: "190101", name: "Chaupimarca" },
          { id: "190102", name: "Huachón" },
          { id: "190103", name: "Huariaca" },
          { id: "190104", name: "Huayllay" },
          { id: "190105", name: "Ninacaca" },
          { id: "190106", name: "Pallanchacra" },
          { id: "190107", name: "Paucartambo" },
          { id: "190108", name: "San Francisco de Asís de Yarusyacán" },
          { id: "190109", name: "Simón Bolívar" },
          { id: "190110", name: "Ticlacayán" },
          { id: "190111", name: "Tinyahuarco" },
          { id: "190112", name: "Vicco" },
          { id: "190113", name: "Yanacancha" }
        ]
      }
    ]
  },
  {
    id: "20",
    name: "Piura",
    code: "328",
    provincias: [
      {
        id: "2001",
        name: "Piura",
        code: "PIU",
        distritos: [
          { id: "200101", name: "Piura" },
          { id: "200102", name: "Castilla" },
          { id: "200103", name: "Catacaos" },
          { id: "200104", name: "Cura Mori" },
          { id: "200105", name: "El Tallán" },
          { id: "200106", name: "La Arena" },
          { id: "200107", name: "La Unión" },
          { id: "200108", name: "Las Lomas" },
          { id: "200109", name: "Tambo Grande" },
          { id: "200110", name: "Veintiséis de Octubre" }
        ]
      },
      {
        id: "2002",
        name: "Talara",
        code: "TAL",
        distritos: [
          { id: "200201", name: "Talara" },
          { id: "200202", name: "La Brea" },
          { id: "200203", name: "Lobitos" },
          { id: "200204", name: "Los Órganos" },
          { id: "200205", name: "Máncora" },
          { id: "200206", name: "Negritos" },
          { id: "200207", name: "Pariñas" },
          { id: "200208", name: "El Alto" }
        ]
      }
    ]
  },
  {
    id: "21",
    name: "Puno",
    code: "PUN",
    provincias: [
      {
        id: "2101",
        name: "Puno",
        code: "PUN",
        distritos: [
          { id: "210101", name: "Puno" },
          { id: "210102", name: "Acora" },
          { id: "210103", name: "Amantani" },
          { id: "210104", name: "Atuncolla" },
          { id: "210105", name: "Capachica" },
          { id: "210106", name: "Chucuito" },
          { id: "210107", name: "Coata" },
          { id: "210108", name: "Huata" },
          { id: "210109", name: "Mañazo" },
          { id: "210110", name: "Paucarcolla" },
          { id: "210111", name: "Pichacani" },
          { id: "210112", name: "Plateria" },
          { id: "210113", name: "San Antonio" },
          { id: "210114", name: "Tiquillaca" },
          { id: "210115", name: "Vilque" }
        ]
      }
    ]
  },
  {
    id: "22",
    name: "San Martín",
    code: "SAM",
    provincias: [
      {
        id: "2201",
        name: "Moyobamba",
        code: "MOY",
        distritos: [
          { id: "220101", name: "Moyobamba" },
          { id: "220102", name: "Calzada" },
          { id: "220103", name: "Habana" },
          { id: "220104", name: "Jepelacio" },
          { id: "220105", name: "Soritor" },
          { id: "220106", name: "Yantalo" }
        ]
      }
    ]
  },
  {
    id: "23",
    name: "Tacna",
    code: "TAC",
    provincias: [
      {
        id: "2301",
        name: "Tacna",
        code: "TAC",
        distritos: [
          { id: "230101", name: "Tacna" },
          { id: "230102", name: "Alto de la Alianza" },
          { id: "230103", name: "Calana" },
          { id: "230104", name: "Ciudad Nueva" },
          { id: "230105", name: "Inclan" },
          { id: "230106", name: "Pachía" },
          { id: "230107", name: "Palca" },
          { id: "230108", name: "Pocollay" },
          { id: "230109", name: "Sama" },
          { id: "230110", name: "Coronel Gregorio Albarracín Lanchipa" }
        ]
      }
    ]
  },
  {
    id: "24",
    name: "Tumbes",
    code: "TUM",
    provincias: [
      {
        id: "2401",
        name: "Tumbes",
        code: "TUM",
        distritos: [
          { id: "240101", name: "Tumbes" },
          { id: "240102", name: "Corrales" },
          { id: "240103", name: "La Cruz" },
          { id: "240104", name: "Pampas de Hospital" },
          { id: "240105", name: "San Jacinto" },
          { id: "240106", name: "San Juan de la Virgen" },
          { id: "240107", name: "Zarumilla" }
        ]
      }
    ]
  },
  {
    id: "25",
    name: "Ucayali",
    code: "UCA",
    provincias: [
      {
        id: "2501",
        name: "Coronel Portillo",
        code: "COR",
        distritos: [
          { id: "250101", name: "Calleria" },
          { id: "250102", name: "Campoverde" },
          { id: "250103", name: "Iparia" },
          { id: "250104", name: "Masisea" },
          { id: "250105", name: "Yarinacocha" },
          { id: "250106", name: "Nueva Requena" },
          { id: "250107", name: "Manantay" }
        ]
      }
    ]
  }
];

// Funciones de utilidad para trabajar con las ubicaciones
export const getDepartamentos = (): Location[] => {
  return peruLocations.map(dept => ({
    id: dept.id,
    name: dept.name,
    code: dept.code
  }));
};

export const getProvinciasByDepartamento = (departamentoId: string): Location[] => {
  const departamento = peruLocations.find(d => d.id === departamentoId);
  return departamento ? departamento.provincias.map(prov => ({
    id: prov.id,
    name: prov.name,
    code: prov.code
  })) : [];
};

export const getDistritosByProvincia = (departamentoId: string, provinciaId: string): Location[] => {
  const departamento = peruLocations.find(d => d.id === departamentoId);
  if (!departamento) return [];
  
  const provincia = departamento.provincias.find(p => p.id === provinciaId);
  return provincia ? provincia.distritos : [];
};

export const getLocationById = (departamentoId: string, provinciaId?: string, distritoId?: string) => {
  const departamento = peruLocations.find(d => d.id === departamentoId);
  if (!departamento) return null;

  if (!provinciaId) return { departamento };

  const provincia = departamento.provincias.find(p => p.id === provinciaId);
  if (!provincia) return { departamento };

  if (!distritoId) return { departamento, provincia };

  const distrito = provincia.distritos.find(d => d.id === distritoId);
  return { departamento, provincia, distrito };
};
