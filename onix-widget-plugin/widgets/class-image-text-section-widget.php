<?php
class Image_Text_Section_Widget extends \Elementor\Widget_Base
{
    public function get_name()
    {
        return 'image_text_section';
    }

    public function get_title()
    {
        return __('Image Text Section', 'onix-widget-plugin');
    }

    public function get_icon()
    {
        return 'eicon-image-box';
    }

    public function get_categories()
    {
        return ['general'];
    }

    public function get_style_depends()
    {
        return ['image-text-section'];
    }

    public function get_script_depends()
    {
        return ['image-text-section-js'];
    }

    protected function _register_controls()
    {
        $this->start_controls_section(
            'content_section',
            [
                'label' => __('Content', 'onix-widget-plugin'),
                'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'title',
            [
                'label' => __('Title', 'onix-widget-plugin'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => __('بزرگترین تولید کننده ی ابزارآلات', 'onix-widget-plugin'),
            ]
        );

        $this->add_control(
            'description',
            [
                'label' => __('Description', 'onix-widget-plugin'),
                'type' => \Elementor\Controls_Manager::TEXTAREA,
                'default' => __('متخصصان ما در اونیکس با تعهد و ابتکار، همواره در تلاشند تا با استفاده از جدیدترین تکنولوژی‌ها و نوآوری‌ها، بهترین ابزارآلات را برای نیازهای مختلف شما طراحی و تولید کنند.', 'onix-widget-plugin'),
            ]
        );

        $this->add_control(
            'button_text',
            [
                'label' => __('Button Text', 'onix-widget-plugin'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => __('مشاهده محصولات', 'onix-widget-plugin'),
            ]
        );

        $this->add_control(
            'button_link',
            [
                'label' => __('Button Link', 'onix-widget-plugin'),
                'type' => \Elementor\Controls_Manager::URL,
                'placeholder' => __('https://your-link.com', 'onix-widget-plugin'),
                'default' => [
                    'url' => '#',
                ],
                'dynamic' => [
                    'active' => true,
                ],
            ]
        );

        $this->add_control(
            'image',
            [
                'label' => __('Choose Image', 'onix-widget-plugin'),
                'type' => \Elementor\Controls_Manager::MEDIA,
                'default' => [
                    'url' => \Elementor\Utils::get_placeholder_image_src(),
                ],
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'menu_section',
            [
                'label' => __('Menu Settings', 'onix-widget-plugin'),
                'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'logo',
            [
                'label' => __('Logo', 'onix-widget-plugin'),
                'type' => \Elementor\Controls_Manager::MEDIA,
                'default' => [
                    'url' => \Elementor\Utils::get_placeholder_image_src(),
                ],
            ]
        );

        $this->add_control(
            'menu',
            [
                'label' => __('Select Menu', 'onix-widget-plugin'),
                'type' => \Elementor\Controls_Manager::SELECT2,
                'options' => $this->get_available_menus(),
                'default' => '',
            ]
        );

        $this->add_control(
            'phone_number',
            [
                'label' => __('Phone Number', 'onix-widget-plugin'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => __('+98 912 123 4567', 'onix-widget-plugin'),
            ]
        );

        $this->add_control(
            'login_url',
            [
                'label' => __('Login URL', 'onix-widget-plugin'),
                'type' => \Elementor\Controls_Manager::URL,
                'placeholder' => __('https://yourdomain.com/login', 'onix-widget-plugin'),
                'default' => [
                    'url' => '#',
                ],
            ]
        );

        $this->end_controls_section();
    }

    protected function get_available_menus()
    {
        $menus = wp_get_nav_menus();
        $menu_options = ['' => __('— Select a Menu —', 'onix-widget-plugin')];

        foreach ($menus as $menu) {
            $menu_options[$menu->term_id] = $menu->name;
        }

        return $menu_options;
    }

    protected function render()
    {
        $settings = $this->get_settings_for_display();
?>
        <div class="image-text-section">
            <div class="site-header">
                <div class="logo">
                    <img src="<?php echo esc_url($settings['logo']['url']); ?>" alt="Onix Logo">
                </div>

                <div class="header-menu-container">
                    <?php if (!empty($settings['menu'])) : ?>
                        <nav class="header-menu">
                            <?php
                            wp_nav_menu([
                                'menu' => $settings['menu'],
                                'container' => false,
                                'menu_class' => 'menu',
                                'echo' => true,
                                'fallback_cb' => '__return_empty_string',
                                'items_wrap' => '<ul id="%1$s" class="%2$s">%3$s</ul>',
                                'depth' => 3,
                                'walker' => new Custom_Nav_Walker(),
                            ]);
                            ?>
                        </nav>
                    <?php endif; ?>
                </div>

                <div class="header-extras">
                    <div class="phone-number">
                        <a href="tel:<?php echo esc_html($settings['phone_number']); ?>">
                            <i class="fas fa-phone"></i>
                            <?php echo esc_html($settings['phone_number']); ?>
                        </a>
                    </div>

                    <div class="login-cart">
                        <a href="<?php echo esc_url($settings['login_url']['url']); ?>" class="login-button">ورود/ثبت نام</a>
                        <a href="<?php echo wc_get_cart_url(); ?>" class="cart-button">سبد خرید</a>
                    </div>
                </div>
            </div>

            <div class="content-wrapper">
                <div class="text-container">
                    <h1><?php echo esc_html($settings['title']); ?></h1>
                    <p><?php echo esc_html($settings['description']); ?></p>
                    <a href="<?php echo esc_url($settings['button_link']['url']); ?>" class="cta-button">
                        <?php echo esc_html($settings['button_text']); ?>
                    </a>
                </div>

                <div class="image-container">
                    <img src="<?php echo esc_url($settings['image']['url']); ?>" alt="Product Image">
                </div>
            </div>
        </div>
<?php
    }
}

class Custom_Nav_Walker extends Walker_Nav_Menu
{
    function start_lvl(&$output, $depth = 0, $args = null)
    {
        $indent = str_repeat("\t", $depth);
        $submenu_class = ($depth === 0) ? 'sub-menu' : 'sub-sub-menu';
        $output .= "\n$indent<ul class=\"$submenu_class\">\n";
    }

    function start_el(&$output, $item, $depth = 0, $args = null, $id = 0)
    {
        $indent = ($depth) ? str_repeat("\t", $depth) : '';

        $classes = empty($item->classes) ? array() : (array) $item->classes;
        $classes[] = 'menu-item-' . $item->ID;

        if ($args->walker->has_children) {
            $classes[] = 'has-submenu';
        }

        $class_names = join(' ', apply_filters('nav_menu_css_class', array_filter($classes), $item, $args, $depth));
        $class_names = $class_names ? ' class="' . esc_attr($class_names) . '"' : '';

        $id = apply_filters('nav_menu_item_id', 'menu-item-' . $item->ID, $item, $args, $depth);
        $id = $id ? ' id="' . esc_attr($id) . '"' : '';

        $output .= $indent . '<li' . $id . $class_names . '>';

        $atts = array();
        $atts['title']  = !empty($item->attr_title) ? $item->attr_title : '';
        $atts['target'] = !empty($item->target)     ? $item->target     : '';
        $atts['rel']    = !empty($item->xfn)        ? $item->xfn        : '';
        $atts['href']   = !empty($item->url)        ? $item->url        : '';

        $atts = apply_filters('nav_menu_link_attributes', $atts, $item, $args, $depth);

        $attributes = '';
        foreach ($atts as $attr => $value) {
            if (!empty($value)) {
                $value = ('href' === $attr) ? esc_url($value) : esc_attr($value);
                $attributes .= ' ' . $attr . '="' . $value . '"';
            }
        }

        $item_output = $args->before;
        $item_output .= '<a' . $attributes . '>';
        $item_output .= $args->link_before . apply_filters('the_title', $item->title, $item->ID) . $args->link_after;
        if ($args->walker->has_children) {
            $item_output .= ' <span class="submenu-indicator"></span>';
        }
        $item_output .= '</a>';
        $item_output .= $args->after;

        $output .= apply_filters('walker_nav_menu_start_el', $item_output, $item, $depth, $args);
    }
}