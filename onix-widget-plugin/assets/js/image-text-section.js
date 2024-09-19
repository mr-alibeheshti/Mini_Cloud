document.addEventListener('DOMContentLoaded', function() {
  const subMenuToggles = document.querySelectorAll('.image-text-section .header-menu ul li.has-submenu > a');
  
  subMenuToggles.forEach(toggle => {
      toggle.addEventListener('click', function(e) {
          if (window.innerWidth <= 768) {
              e.preventDefault();
              this.parentNode.querySelector('.sub-menu, .sub-sub-menu').style.display = 
                  this.parentNode.querySelector('.sub-menu, .sub-sub-menu').style.display === 'block' ? 'none' : 'block';
          }
      });
  });
});