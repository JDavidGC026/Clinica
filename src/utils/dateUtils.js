// Utilidades para manejo de fechas en zona horaria de México
export class MexicoDateUtils {
  static TIMEZONE = 'America/Mexico_City';
  static LOCALE = 'es-MX';

  // Obtener fecha actual en México en formato YYYY-MM-DD
  static getTodayInMexico() {
    const now = new Date();
    const mexicoTime = new Date(now.toLocaleString("en-US", {timeZone: this.TIMEZONE}));
    
    const year = mexicoTime.getFullYear();
    const month = String(mexicoTime.getMonth() + 1).padStart(2, '0');
    const day = String(mexicoTime.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  // Convertir fecha de BD a formato local sin problemas de zona horaria
  static formatDateFromDB(dateString) {
    if (!dateString) return '';
    
    // Si ya está en formato YYYY-MM-DD, devolverla tal como está
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    
    // Si es una fecha ISO completa, extraer solo la parte de fecha
    if (typeof dateString === 'string' && dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    
    // Para otros casos, crear fecha local
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error('Fecha inválida:', dateString);
      return '';
    }
    
    // Usar UTC para evitar problemas de zona horaria
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  // Crear fecha para envío a BD (mantener formato YYYY-MM-DD)
  static formatDateForDB(dateString) {
    if (!dateString) return '';
    
    // Si ya está en formato correcto, devolverla tal como está
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    
    return this.formatDateFromDB(dateString);
  }

  // Formatear fecha para mostrar al usuario
  static formatDateForDisplay(dateString, options = {}) {
    if (!dateString) return '';
    
    try {
      // Crear fecha sin problemas de zona horaria
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      const defaultOptions = {
        timeZone: this.TIMEZONE,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        ...options
      };
      
      return date.toLocaleDateString(this.LOCALE, defaultOptions);
    } catch (error) {
      console.error('Error formateando fecha para display:', error);
      return dateString;
    }
  }

  // Formatear fecha y hora para mostrar
  static formatDateTimeForDisplay(dateString, timeString = '', options = {}) {
    if (!dateString) return '';
    
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      let date = new Date(year, month - 1, day);
      
      // Si hay hora, agregarla
      if (timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        date.setHours(hours, minutes, 0, 0);
      }
      
      const defaultOptions = {
        timeZone: this.TIMEZONE,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        ...(timeString && {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        ...options
      };
      
      return date.toLocaleDateString(this.LOCALE, defaultOptions);
    } catch (error) {
      console.error('Error formateando fecha y hora:', error);
      return `${dateString} ${timeString}`;
    }
  }

  // Verificar si una fecha es válida
  static isValidDate(dateString) {
    if (!dateString) return false;
    
    // Verificar formato YYYY-MM-DD
    if (!dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return false;
    
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day;
  }

  // Comparar fechas (devuelve -1, 0, 1)
  static compareDates(date1, date2) {
    if (!this.isValidDate(date1) || !this.isValidDate(date2)) {
      throw new Error('Fechas inválidas para comparación');
    }
    
    if (date1 < date2) return -1;
    if (date1 > date2) return 1;
    return 0;
  }

  // Verificar si una fecha es hoy
  static isToday(dateString) {
    return dateString === this.getTodayInMexico();
  }

  // Verificar si una fecha es en el futuro
  static isFuture(dateString) {
    return this.compareDates(dateString, this.getTodayInMexico()) > 0;
  }

  // Verificar si una fecha es en el pasado
  static isPast(dateString) {
    return this.compareDates(dateString, this.getTodayInMexico()) < 0;
  }

  // Agregar días a una fecha
  static addDays(dateString, days) {
    if (!this.isValidDate(dateString)) {
      throw new Error('Fecha inválida');
    }
    
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    const newDay = String(date.getDate()).padStart(2, '0');
    
    return `${newYear}-${newMonth}-${newDay}`;
  }

  // Obtener diferencia en días entre dos fechas
  static getDaysDifference(date1, date2) {
    if (!this.isValidDate(date1) || !this.isValidDate(date2)) {
      throw new Error('Fechas inválidas');
    }
    
    const [year1, month1, day1] = date1.split('-').map(Number);
    const [year2, month2, day2] = date2.split('-').map(Number);
    
    const d1 = new Date(year1, month1 - 1, day1);
    const d2 = new Date(year2, month2 - 1, day2);
    
    const diffTime = d2.getTime() - d1.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

export default MexicoDateUtils;