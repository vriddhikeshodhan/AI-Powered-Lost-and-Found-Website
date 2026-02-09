--
-- PostgreSQL database dump
--

\restrict K6Uf0EapGfOt9Rj3ldUakickgTwONMXNfbk9WX85gqovc77Rna0ErORFeNh2WBn

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-02-09 21:32:08

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 879 (class 1247 OID 16435)
-- Name: item_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.item_type_enum AS ENUM (
    'Lost',
    'Found'
);


ALTER TYPE public.item_type_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 224 (class 1259 OID 16424)
-- Name: category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.category (
    category_id integer NOT NULL,
    category_name character varying(100) NOT NULL
);


ALTER TABLE public.category OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16423)
-- Name: category_category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.category_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.category_category_id_seq OWNER TO postgres;

--
-- TOC entry 5133 (class 0 OID 0)
-- Dependencies: 223
-- Name: category_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.category_category_id_seq OWNED BY public.category.category_id;


--
-- TOC entry 229 (class 1259 OID 16480)
-- Name: image_sequence; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.image_sequence (
    image_id integer NOT NULL,
    sequence_no integer NOT NULL,
    image_version character varying(20)
);


ALTER TABLE public.image_sequence OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16466)
-- Name: item_image; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.item_image (
    image_id integer NOT NULL,
    item_id integer,
    image_url character varying(255) NOT NULL,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.item_image OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16465)
-- Name: item_image_image_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.item_image_image_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.item_image_image_id_seq OWNER TO postgres;

--
-- TOC entry 5134 (class 0 OID 0)
-- Dependencies: 227
-- Name: item_image_image_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.item_image_image_id_seq OWNED BY public.item_image.image_id;


--
-- TOC entry 226 (class 1259 OID 16440)
-- Name: items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.items (
    item_id integer NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    category_id integer NOT NULL,
    location text,
    date_reported timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    type public.item_type_enum NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.items OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16439)
-- Name: items_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.items_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.items_item_id_seq OWNER TO postgres;

--
-- TOC entry 5135 (class 0 OID 0)
-- Dependencies: 225
-- Name: items_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.items_item_id_seq OWNED BY public.items.item_id;


--
-- TOC entry 231 (class 1259 OID 16495)
-- Name: match_status; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.match_status (
    status_id integer NOT NULL,
    status_name character varying(20) NOT NULL
);


ALTER TABLE public.match_status OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16494)
-- Name: match_status_status_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.match_status_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.match_status_status_id_seq OWNER TO postgres;

--
-- TOC entry 5136 (class 0 OID 0)
-- Dependencies: 230
-- Name: match_status_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.match_status_status_id_seq OWNED BY public.match_status.status_id;


--
-- TOC entry 233 (class 1259 OID 16506)
-- Name: matches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.matches (
    match_id integer NOT NULL,
    confidence_score numeric(5,2) NOT NULL,
    status_id integer NOT NULL,
    lost_item_id integer NOT NULL,
    found_item_id integer NOT NULL
);


ALTER TABLE public.matches OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 16505)
-- Name: matches_match_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.matches_match_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.matches_match_id_seq OWNER TO postgres;

--
-- TOC entry 5137 (class 0 OID 0)
-- Dependencies: 232
-- Name: matches_match_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.matches_match_id_seq OWNED BY public.matches.match_id;


--
-- TOC entry 237 (class 1259 OID 16564)
-- Name: message; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.message (
    message_id integer NOT NULL,
    content character varying(200) NOT NULL,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    sender_id integer,
    receiver_id integer
);


ALTER TABLE public.message OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 16563)
-- Name: message_message_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.message_message_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.message_message_id_seq OWNER TO postgres;

--
-- TOC entry 5138 (class 0 OID 0)
-- Dependencies: 236
-- Name: message_message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.message_message_id_seq OWNED BY public.message.message_id;


--
-- TOC entry 235 (class 1259 OID 16533)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    notification_id integer NOT NULL,
    user_id integer NOT NULL,
    item_id integer NOT NULL,
    match_id integer NOT NULL,
    content text NOT NULL,
    email_sent boolean DEFAULT true,
    sent_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 16532)
-- Name: notifications_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_notification_id_seq OWNER TO postgres;

--
-- TOC entry 5139 (class 0 OID 0)
-- Dependencies: 234
-- Name: notifications_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_notification_id_seq OWNED BY public.notifications.notification_id;


--
-- TOC entry 220 (class 1259 OID 16390)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    role_id integer NOT NULL,
    role_name character varying(10) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16389)
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_role_id_seq OWNER TO postgres;

--
-- TOC entry 5140 (class 0 OID 0)
-- Dependencies: 219
-- Name: roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_role_id_seq OWNED BY public.roles.role_id;


--
-- TOC entry 222 (class 1259 OID 16402)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    name character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(128) NOT NULL,
    role_id integer NOT NULL,
    is_verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16401)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- TOC entry 5141 (class 0 OID 0)
-- Dependencies: 221
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 4907 (class 2604 OID 16427)
-- Name: category category_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category ALTER COLUMN category_id SET DEFAULT nextval('public.category_category_id_seq'::regclass);


--
-- TOC entry 4910 (class 2604 OID 16469)
-- Name: item_image image_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.item_image ALTER COLUMN image_id SET DEFAULT nextval('public.item_image_image_id_seq'::regclass);


--
-- TOC entry 4908 (class 2604 OID 16443)
-- Name: items item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items ALTER COLUMN item_id SET DEFAULT nextval('public.items_item_id_seq'::regclass);


--
-- TOC entry 4912 (class 2604 OID 16498)
-- Name: match_status status_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_status ALTER COLUMN status_id SET DEFAULT nextval('public.match_status_status_id_seq'::regclass);


--
-- TOC entry 4913 (class 2604 OID 16509)
-- Name: matches match_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches ALTER COLUMN match_id SET DEFAULT nextval('public.matches_match_id_seq'::regclass);


--
-- TOC entry 4917 (class 2604 OID 16567)
-- Name: message message_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message ALTER COLUMN message_id SET DEFAULT nextval('public.message_message_id_seq'::regclass);


--
-- TOC entry 4914 (class 2604 OID 16536)
-- Name: notifications notification_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN notification_id SET DEFAULT nextval('public.notifications_notification_id_seq'::regclass);


--
-- TOC entry 4903 (class 2604 OID 16393)
-- Name: roles role_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);


--
-- TOC entry 4904 (class 2604 OID 16405)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 5114 (class 0 OID 16424)
-- Dependencies: 224
-- Data for Name: category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.category (category_id, category_name) FROM stdin;
1	Electronics
2	Wallet
3	Keys
4	Documents
\.


--
-- TOC entry 5119 (class 0 OID 16480)
-- Dependencies: 229
-- Data for Name: image_sequence; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.image_sequence (image_id, sequence_no, image_version) FROM stdin;
1	1	1_1
\.


--
-- TOC entry 5118 (class 0 OID 16466)
-- Dependencies: 228
-- Data for Name: item_image; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.item_image (image_id, item_id, image_url, uploaded_at) FROM stdin;
1	1	wallet_lost_1.jpg	2026-01-08 20:16:58.919982
2	2	wallet_found_1.jpg	2026-01-08 20:16:58.919982
\.


--
-- TOC entry 5116 (class 0 OID 16440)
-- Dependencies: 226
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.items (item_id, title, description, category_id, location, date_reported, type, user_id) FROM stdin;
1	Black Wallet	Leather wallet with ID cards	2	Library	2026-01-08 20:16:37.817457	Lost	1
2	Black Wallet	Found near library stairs	2	Library	2026-01-08 20:16:37.817457	Found	2
3	Black Wallet	Black leather wallet with college ID	2	University Library	2026-01-09 15:17:26.267286	Lost	4
4	Black Wallet	Black leather wallet with college ID	2	University Library	2026-01-09 15:25:54.57336	Lost	4
5	Blue Umbrella	Found a blue umbrella near the cafeteria entrance.	4	Cafeteria	2026-01-09 15:31:36.016725	Found	4
6	Phone	Black wallpaper	2	Library	2026-01-09 16:11:58.608805	Lost	4
\.


--
-- TOC entry 5121 (class 0 OID 16495)
-- Dependencies: 231
-- Data for Name: match_status; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.match_status (status_id, status_name) FROM stdin;
1	pending
2	matched
3	verified
4	rejected
\.


--
-- TOC entry 5123 (class 0 OID 16506)
-- Dependencies: 233
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.matches (match_id, confidence_score, status_id, lost_item_id, found_item_id) FROM stdin;
1	92.50	2	1	2
\.


--
-- TOC entry 5127 (class 0 OID 16564)
-- Dependencies: 237
-- Data for Name: message; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.message (message_id, content, "timestamp", sender_id, receiver_id) FROM stdin;
1	Is this your wallet?	2026-01-08 20:18:35.270204	2	1
\.


--
-- TOC entry 5125 (class 0 OID 16533)
-- Dependencies: 235
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (notification_id, user_id, item_id, match_id, content, email_sent, sent_at) FROM stdin;
1	1	1	1	A possible match has been found for your lost item	t	2026-01-08 20:18:19.826015
\.


--
-- TOC entry 5110 (class 0 OID 16390)
-- Dependencies: 220
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (role_id, role_name) FROM stdin;
1	USER
2	ADMIN
\.


--
-- TOC entry 5112 (class 0 OID 16402)
-- Dependencies: 222
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, name, email, password_hash, role_id, is_verified, created_at) FROM stdin;
1	Aarav Sharma	aarav@gmail.com	passwordhash123	1	f	2026-01-08 20:14:36.519447
2	Neha Verma	neha@gmail.com	passwordhash123	1	f	2026-01-08 20:14:36.519447
4	Demo User	demo@lostfound.com	$2b$10$tTxr.MfCMvVKEZEczxPzTuxoi8.zL8NEme3CGdViS5s5oPTQ9.fJu	1	t	2026-01-09 00:18:23.938777
\.


--
-- TOC entry 5142 (class 0 OID 0)
-- Dependencies: 223
-- Name: category_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.category_category_id_seq', 4, true);


--
-- TOC entry 5143 (class 0 OID 0)
-- Dependencies: 227
-- Name: item_image_image_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.item_image_image_id_seq', 2, true);


--
-- TOC entry 5144 (class 0 OID 0)
-- Dependencies: 225
-- Name: items_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.items_item_id_seq', 6, true);


--
-- TOC entry 5145 (class 0 OID 0)
-- Dependencies: 230
-- Name: match_status_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.match_status_status_id_seq', 4, true);


--
-- TOC entry 5146 (class 0 OID 0)
-- Dependencies: 232
-- Name: matches_match_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.matches_match_id_seq', 1, true);


--
-- TOC entry 5147 (class 0 OID 0)
-- Dependencies: 236
-- Name: message_message_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.message_message_id_seq', 1, true);


--
-- TOC entry 5148 (class 0 OID 0)
-- Dependencies: 234
-- Name: notifications_notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_notification_id_seq', 1, true);


--
-- TOC entry 5149 (class 0 OID 0)
-- Dependencies: 219
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_role_id_seq', 2, true);


--
-- TOC entry 5150 (class 0 OID 0)
-- Dependencies: 221
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 4, true);


--
-- TOC entry 4928 (class 2606 OID 16433)
-- Name: category category_category_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_category_name_key UNIQUE (category_name);


--
-- TOC entry 4930 (class 2606 OID 16431)
-- Name: category category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_pkey PRIMARY KEY (category_id);


--
-- TOC entry 4936 (class 2606 OID 16488)
-- Name: image_sequence image_sequence_image_version_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.image_sequence
    ADD CONSTRAINT image_sequence_image_version_key UNIQUE (image_version);


--
-- TOC entry 4938 (class 2606 OID 16486)
-- Name: image_sequence image_sequence_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.image_sequence
    ADD CONSTRAINT image_sequence_pkey PRIMARY KEY (image_id, sequence_no);


--
-- TOC entry 4934 (class 2606 OID 16474)
-- Name: item_image item_image_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.item_image
    ADD CONSTRAINT item_image_pkey PRIMARY KEY (image_id);


--
-- TOC entry 4932 (class 2606 OID 16454)
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (item_id);


--
-- TOC entry 4940 (class 2606 OID 16502)
-- Name: match_status match_status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_status
    ADD CONSTRAINT match_status_pkey PRIMARY KEY (status_id);


--
-- TOC entry 4942 (class 2606 OID 16504)
-- Name: match_status match_status_status_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_status
    ADD CONSTRAINT match_status_status_name_key UNIQUE (status_name);


--
-- TOC entry 4944 (class 2606 OID 16516)
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (match_id);


--
-- TOC entry 4948 (class 2606 OID 16572)
-- Name: message message_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_pkey PRIMARY KEY (message_id);


--
-- TOC entry 4946 (class 2606 OID 16547)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notification_id);


--
-- TOC entry 4920 (class 2606 OID 16397)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- TOC entry 4922 (class 2606 OID 16399)
-- Name: roles roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);


--
-- TOC entry 4924 (class 2606 OID 16416)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4926 (class 2606 OID 16414)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4953 (class 2606 OID 16489)
-- Name: image_sequence image_sequence_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.image_sequence
    ADD CONSTRAINT image_sequence_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.item_image(image_id);


--
-- TOC entry 4952 (class 2606 OID 16475)
-- Name: item_image item_image_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.item_image
    ADD CONSTRAINT item_image_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(item_id);


--
-- TOC entry 4950 (class 2606 OID 16455)
-- Name: items items_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.category(category_id);


--
-- TOC entry 4951 (class 2606 OID 16460)
-- Name: items items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 4954 (class 2606 OID 16527)
-- Name: matches matches_found_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_found_item_id_fkey FOREIGN KEY (found_item_id) REFERENCES public.items(item_id);


--
-- TOC entry 4955 (class 2606 OID 16522)
-- Name: matches matches_lost_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_lost_item_id_fkey FOREIGN KEY (lost_item_id) REFERENCES public.items(item_id);


--
-- TOC entry 4956 (class 2606 OID 16517)
-- Name: matches matches_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.match_status(status_id);


--
-- TOC entry 4960 (class 2606 OID 16578)
-- Name: message message_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(user_id);


--
-- TOC entry 4961 (class 2606 OID 16573)
-- Name: message message_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(user_id);


--
-- TOC entry 4957 (class 2606 OID 16553)
-- Name: notifications notifications_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(item_id);


--
-- TOC entry 4958 (class 2606 OID 16558)
-- Name: notifications notifications_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(match_id);


--
-- TOC entry 4959 (class 2606 OID 16548)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 4949 (class 2606 OID 16417)
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id);


-- Completed on 2026-02-09 21:32:09

--
-- PostgreSQL database dump complete
--

\unrestrict K6Uf0EapGfOt9Rj3ldUakickgTwONMXNfbk9WX85gqovc77Rna0ErORFeNh2WBn

