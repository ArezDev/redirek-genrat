import Swal from 'sweetalert2';

export const showLoadingSwal = (text = 'Sedang diproses...') =>
  Swal.fire({
    title: text,
    allowOutsideClick: false,
    timerProgressBar: true,
    didOpen: () => {
      Swal.showLoading();
    },
  });

export const closeSwal = () => Swal.close();