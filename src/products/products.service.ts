import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductImage } from './entities/index';
import { PaginationDto } from '../common/dtos/pagination.dto';
import {validate as isUUID} from 'uuid';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger()

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,

  ){}

  async create(createProductDto: CreateProductDto, user: User) {

    try {
      const { images = [], ... productDetails} = createProductDto;


      const product = this.productRepository.create({
        ...productDetails,
        images: images.map(image => this.productImageRepository.create({url: image})),
        user
      }); //This only creates the entity from the dto. Doesn´t affect the db
      await this.productRepository.save(product)
      return {...product, images}
      
    } catch (error) {
      this.handleDBExceptions(error);
    }

  }

  async findAll(paginationDto: PaginationDto) {
    const {limit = 10, offset = 0} = paginationDto;
    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true
      }
    });

    return products.map( product => ({
      ...product,
      images: product.images.map( img => img.url )
    }))
  }

  async findOne(searchTerm: string) {
  let product: Product;
    if(isUUID(searchTerm)){
      product = await this.productRepository.findOneBy({id: searchTerm})
    } else{
      const queryBuilder = this.productRepository.createQueryBuilder('prod');
      product = await queryBuilder
      .where(`UPPER(title) =:title or slug=:slug`, { //The two dots is to give the parameter
        title: searchTerm.toUpperCase(),
        slug: searchTerm.toLowerCase()
      })
      .leftJoinAndSelect('prod.images', 'prodImages')
      .getOne()

    }

    if (!product){
      throw new NotFoundException(`Couldn't find any product with the id ${searchTerm}`)
    } 
    return product;
  }

  async findOnePlain(term: string){
    const {images = [], ...rest} = await this.findOne(term);
    return{
      ...rest,
      images: images.map(image=> image.url)
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto, user: User) {
    const {images, ...toUpdate} = updateProductDto;   
    
    const product = await this.productRepository.preload({ //The preload just find the record with the id and prepare it for the action.
      id,
      ...toUpdate
    })

    if(!product) throw new NotFoundException(`Product with id: ${id} not found`)

    //Create query runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();


    try {
      if (images){
        await queryRunner.manager.delete(ProductImage, {product: {id}})

        product.images = images.map(
          image => this.productImageRepository.create({url: image})
        )
      } else {

      }

      product.user = user;
      await queryRunner.manager.save(product); //When using queryRunner manager there is no impact of the db
      // const updatedProduct = await this.productRepository.save(product);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return this.findOnePlain(id);
      
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleDBExceptions(error)
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    if (product){
      await this.productRepository.delete({id})
    } 
  }

  private handleDBExceptions(error: any ){
    if (error.code === '23505')
        throw new BadRequestException(error.detail)
      this.logger.error(error)
      throw new InternalServerErrorException('Unexpected error, check server logs')
  }

  async deleteAllProducts(){ //Just for development, DONT DO IT IN PRODUCTION ENVIRONMENT
    const query = this.productRepository.createQueryBuilder('product');

    try {
      return await query
      .delete()
      .where({})
      .execute();

    } catch (error) {
      this.handleDBExceptions(error)
    }
  }


}
