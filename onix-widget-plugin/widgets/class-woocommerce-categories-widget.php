<?php
class WooCommerce_Categories_Widget extends \Elementor\Widget_Base
{
    public function get_name()
    {
        return 'woocommerce_categories';
    }

    public function get_title()
    {
        return __('WooCommerce Categories', 'my-elementor-widgets');
    }

    public function get_icon()
    {
        return 'eicon-product-categories';
    }

    public function get_categories()
    {
        return ['general'];
    }

    public function get_style_depends()
    {
        return ['woocommerce-categories'];
    }

    protected function _register_controls()
    {
        $this->start_controls_section(
            'content_section',
            [
                'label' => __('Content', 'my-elementor-widgets'),
                'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'title',
            [
                'label' => __('Title', 'my-elementor-widgets'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => __('دسته بندی محصولات', 'my-elementor-widgets'),
            ]
        );

        $categories = get_terms(['taxonomy' => 'product_cat', 'hide_empty' => false]);
        $cat_options = [];
        foreach ($categories as $category) {
            $cat_options[$category->term_id] = $category->name;
        }

        $repeater = new \Elementor\Repeater();

        $repeater->add_control(
            'category_icon',
            [
                'label' => __('Category Icon', 'my-elementor-widgets'),
                'type' => \Elementor\Controls_Manager::MEDIA,
                'default' => [
                    'url' => \Elementor\Utils::get_placeholder_image_src(),
                ],
            ]
        );

        $repeater->add_control(
            'category_id',
            [
                'label' => __('Category', 'my-elementor-widgets'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'options' => $cat_options,
            ]
        );

        $this->add_control(
            'category_list',
            [
                'label' => __('Categories', 'my-elementor-widgets'),
                'type' => \Elementor\Controls_Manager::REPEATER,
                'fields' => $repeater->get_controls(),
                'title_field' => '{{{ category_id }}}',
            ]
        );

        $this->end_controls_section();
    }

    protected function render()
    {
        $settings = $this->get_settings_for_display();

        echo '<div class="woocommerce-categories">';
        echo '<div class="category-carousel">';
        echo '<div class="category-header">';
        echo '<img src="' . plugins_url('assets/images/Polygon 1.png', dirname(__FILE__)) . '" alt="Polygon" class="category-title-icon">';
        echo '<h2 class="category-title">' . esc_html($settings['title']) . '</h2>';
        echo '<div class="header-separator"></div>';
        echo '<div class="nav-buttons">';
        echo '<button class="nav-button prev">&#10094;</button>';
        echo '<button class="nav-button next">&#10095;</button>';
        echo '</div>';
        echo '</div>';
        echo '<div class="category-grid">';

        foreach ($settings['category_list'] as $item) {
            $category = get_term($item['category_id'], 'product_cat');
            if ($category && !is_wp_error($category)) {
                $category_link = get_term_link($category->term_id, 'product_cat');

                echo '<a href="' . esc_url($category_link) . '" class="category-item">';
                echo '<div class="category-icon">';
                echo '<img src="' . esc_url($item['category_icon']['url']) . '" alt="' . esc_attr($category->name) . '">';
                echo '</div>';
                echo '<span class="category-name">' . esc_html($category->name) . '</span>';
                echo '<span class="view-price">مشاهده قیمت</span>';
                echo '</a>';
            }
        }

        echo '</div>';
        echo '</div>';
        echo '</div>';

        // Обновленный JavaScript
        echo '<script>
        document.addEventListener("DOMContentLoaded", function() {
            const grid = document.querySelector(".category-grid");
            const prevBtn = document.querySelector(".nav-button.prev");
            const nextBtn = document.querySelector(".nav-button.next");
            const items = grid.querySelectorAll(".category-item");
            
            if (items.length > 0) {
                const updateScrollBehavior = () => {
                    const viewportWidth = window.innerWidth;
                    let itemsPerScroll;
                    
                    if (viewportWidth > 1024) {
                        itemsPerScroll = 7;
                    } else if (viewportWidth > 768) {
                        itemsPerScroll = 5;
                    } else if (viewportWidth > 480) {
                        itemsPerScroll = 3;
                    } else {
                        itemsPerScroll = 2;
                    }

                    const itemWidth = items[0].offsetWidth;
                    const gapWidth = 20; // Ширина промежутка между элементами
                    
                    nextBtn.addEventListener("click", () => {
                        grid.scrollBy({ left: -((itemWidth + gapWidth) * itemsPerScroll), behavior: "smooth" });
                    });
                    
                    prevBtn.addEventListener("click", () => {
                        grid.scrollBy({ left: (itemWidth + gapWidth) * itemsPerScroll, behavior: "smooth" });
                    });
                };

                updateScrollBehavior();
                window.addEventListener("resize", updateScrollBehavior);
            }
        });
        </script>';
    }
}
