<?php
/**
 * Plugin Name: Onix Widget Plugin
 * Description: Custom Elementor widgets including Image Text Section and WooCommerce Categories
 * Version: 1.0.0
 * Author: Your Name
 * Text Domain: onix-widget-plugin
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

final class My_Elementor_Widgets {
    const VERSION = '1.0.0';
    const MINIMUM_ELEMENTOR_VERSION = '3.0.0';
    const MINIMUM_PHP_VERSION = '7.0';

    private static $_instance = null;

    public static function instance() {
        if (is_null(self::$_instance)) {
            self::$_instance = new self();
        }
        return self::$_instance;
    }

    public function __construct() {
        add_action('plugins_loaded', [$this, 'init']);
    }

    public function init() {
        // Load plugin textdomain
        load_plugin_textdomain('onix-widget-plugin');

        // Check for required PHP version
        if (version_compare(PHP_VERSION, self::MINIMUM_PHP_VERSION, '<')) {
            add_action('admin_notices', [$this, 'admin_notice_minimum_php_version']);
            return;
        }

        // Check for Elementor
        if (!did_action('elementor/loaded')) {
            add_action('admin_notices', [$this, 'admin_notice_missing_main_plugin']);
            return;
        }

        // Check for required Elementor version
        if (!version_compare(ELEMENTOR_VERSION, self::MINIMUM_ELEMENTOR_VERSION, '>=')) {
            add_action('admin_notices', [$this, 'admin_notice_minimum_elementor_version']);
            return;
        }

        // Add Plugin actions
        add_action('elementor/widgets/register', [$this, 'init_widgets']);
        add_action('elementor/frontend/after_enqueue_styles', [$this, 'widget_styles']);
    }

    public function init_widgets() {
        // Include Widget files
        require_once(__DIR__ . '/widgets/class-image-text-section-widget.php');
        require_once(__DIR__ . '/widgets/class-woocommerce-categories-widget.php');

        // Register widgets
        \Elementor\Plugin::instance()->widgets_manager->register(new \Image_Text_Section_Widget());
        \Elementor\Plugin::instance()->widgets_manager->register(new \WooCommerce_Categories_Widget());
    }

    public function widget_styles() {
        wp_register_style('image-text-section', plugins_url('assets/css/image-text-section.css', __FILE__));
        wp_register_style('woocommerce-categories', plugins_url('assets/css/woocommerce-categories.css', __FILE__));
    }

    public function admin_notice_minimum_php_version() {
        if (isset($_GET['activate'])) unset($_GET['activate']);

        $message = sprintf(
            /* translators: 1: Plugin name 2: PHP 3: Required PHP version */
            esc_html__('"%1$s" requires "%2$s" version %3$s or greater.', 'onix-widget-plugin'),
            '<strong>' . esc_html__('Onix Widget Plugin', 'onix-widget-plugin') . '</strong>',
            '<strong>' . esc_html__('PHP', 'onix-widget-plugin') . '</strong>',
            self::MINIMUM_PHP_VERSION
        );

        printf('<div class="notice notice-warning is-dismissible"><p>%1$s</p></div>', $message);
    }

    public function admin_notice_missing_main_plugin() {
        if (isset($_GET['activate'])) unset($_GET['activate']);

        $message = sprintf(
            /* translators: 1: Plugin name 2: Elementor */
            esc_html__('"%1$s" requires "%2$s" to be installed and activated.', 'onix-widget-plugin'),
            '<strong>' . esc_html__('Onix Widget Plugin', 'onix-widget-plugin') . '</strong>',
            '<strong>' . esc_html__('Elementor', 'onix-widget-plugin') . '</strong>'
        );

        printf('<div class="notice notice-warning is-dismissible"><p>%1$s</p></div>', $message);
    }

    public function admin_notice_minimum_elementor_version() {
        if (isset($_GET['activate'])) unset($_GET['activate']);

        $message = sprintf(
            /* translators: 1: Plugin name 2: Elementor 3: Required Elementor version */
            esc_html__('"%1$s" requires "%2$s" version %3$s or greater.', 'onix-widget-plugin'),
            '<strong>' . esc_html__('Onix Widget Plugin', 'onix-widget-plugin') . '</strong>',
            '<strong>' . esc_html__('Elementor', 'onix-widget-plugin') . '</strong>',
            self::MINIMUM_ELEMENTOR_VERSION
        );

        printf('<div class="notice notice-warning is-dismissible"><p>%1$s</p></div>', $message);
    }
}

// Instantiate My_Elementor_Widgets
My_Elementor_Widgets::instance();